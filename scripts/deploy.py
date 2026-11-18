"""Solicita deploy da branch do hook após push validado. Não imprime o segredo."""
import json,os,urllib.request,urllib.error
from preflight import validate_config

def trigger(env, opener=urllib.request.urlopen):
    validate_config(env)
    req=urllib.request.Request(env['VERCEL_DEPLOY_HOOK'],data=b'',method='POST')
    try:
        with opener(req,timeout=45) as r:
            result=json.load(r)
    except urllib.error.HTTPError as e:
        raise RuntimeError('Vercel recusou a solicitação (HTTP '+str(e.code)+'). Confira o Deploy Hook.') from None
    except (urllib.error.URLError,TimeoutError,ValueError):
        raise RuntimeError('Não foi possível confirmar a solicitação. Confira Deployments na Vercel antes de repetir.') from None
    if not isinstance(result,dict) or not isinstance(result.get('job'),dict) or not result['job'].get('id'):
        raise RuntimeError('Resposta inesperada. Confira Deployments na Vercel antes de repetir.')
    print('Publicação solicitada. Confira o status Ready na Vercel; o aceite não comprova publicação concluída.')
    return result

if __name__=='__main__':
    try:trigger(os.environ)
    except (ValueError,RuntimeError) as e:raise SystemExit(str(e))
