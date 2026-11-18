"""Verifica configuração sem revelar segredos."""
import os
from urllib.parse import urlsplit

def validate_config(env):
    missing=[k for k in ('VERCEL_DEPLOY_HOOK','RADAR_COMMIT_NAME','RADAR_COMMIT_EMAIL') if not env.get(k,'').strip()]
    if missing:raise ValueError('Configure no GitHub: '+', '.join(missing))
    u=urlsplit(env['VERCEL_DEPLOY_HOOK'])
    if u.scheme!='https' or u.netloc!='api.vercel.com' or not u.path.startswith('/v1/integrations/deploy/'):
        raise ValueError('Deploy Hook inválido. Copie o endereço gerado pela Vercel.')
    if '@' not in env['RADAR_COMMIT_EMAIL']:raise ValueError('Informe seu email verificado no GitHub ou seu noreply oficial.')

if __name__=='__main__':
    try:validate_config(os.environ)
    except ValueError as e:raise SystemExit(str(e))
    print('Configuração presente. O acesso será verificado na publicação.')
