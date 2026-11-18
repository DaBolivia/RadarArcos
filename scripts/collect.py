#!/usr/bin/env python3
"""Coleta pública SAPL. Falha fechada: só substitui JSON após validar todas as páginas."""
from zoneinfo import ZoneInfo
import urllib.request, urllib.parse, json, time, datetime, concurrent.futures, pathlib, os, hashlib
BASE='https://sapl.arcos.mg.leg.br'
ROOT=pathlib.Path(__file__).resolve().parents[1]
def request(url):
 for attempt in range(4):
  try:
   with urllib.request.urlopen(url.replace('http:','https:'),timeout=60) as r:return json.load(r)
  except Exception:
   if attempt==3:raise
   time.sleep(2**attempt)
def fetch(path):
 cache=pathlib.Path(os.environ['COLLECT_CACHE'])/hashlib.sha256(path.encode()).hexdigest() if os.environ.get('COLLECT_CACHE') else None
 if cache and cache.exists():return json.loads(cache.read_text())
 url=BASE+'/api/'+path+('&' if '?' in path else '?')+'page_size=100&ordering=id'
 d=request(url); p=d['pagination']; rows=d['results']
 def page(n):return request(url+'&page='+str(n))['results']
 with concurrent.futures.ThreadPoolExecutor(4) as ex:
  for r in ex.map(page,range(2,p['total_pages']+1)): rows.extend(r)
 assert len(rows)==p['total_entries'] and len({r['id'] for r in rows})==len(rows),path
 if cache:
  cache.parent.mkdir(parents=True,exist_ok=True);cache.write_text(json.dumps(rows))
 print(path,len(rows),flush=True)
 return rows
def main():
 years=range(2025,min(datetime.datetime.now(ZoneInfo('America/Sao_Paulo')).date().year,2028)+1)
 paths={**{f'materials{y}':f'materia/materialegislativa/?ano={y}' for y in years},'people':'parlamentares/parlamentar/','authors':'base/autor/','types':'materia/tipomaterialegislativa/','sessions':'sessao/sessaoplenaria/','votes':'sessao/registrovotacao/','ballots':'sessao/votoparlamentar/','mandates':'parlamentares/mandato/'}
 data={}
 # Endpoint collections are serialized; each uses a bounded four-page pool.
 for key,path in paths.items():data[key]=fetch(path)
 today=datetime.datetime.now(ZoneInfo('America/Sao_Paulo')).date().isoformat()
 data['materials']=[r for r in [r for y in years for r in data.pop(f'materials{y}')] if r['data_apresentacao']<=today]
 mids={r['id'] for r in data['materials']}
 data['sessions']=[s for s in data['sessions'] if '2025-01-01'<=s['data_inicio']<=today]
 sids={s['id'] for s in data['sessions']}
 def get_session_records(task):
  key,path,sid=task
  rows=fetch(path+'?sessao_plenaria='+str(sid))
  assert all(p['sessao_plenaria']==sid for p in rows),'Filtro de sessão ignorado'
  return key,rows
 for key in ['presence','agenda','order']:data[key]=[]
 tasks=[(key,path,sid) for sid in sorted(sids) for key,path in [('presence','sessao/sessaoplenariapresenca/'),('agenda','sessao/expedientemateria/'),('order','sessao/ordemdia/')]]
 with concurrent.futures.ThreadPoolExecutor(4) as ex:
  for key,rows in ex.map(get_session_records,tasks):data[key].extend(rows)
 aids={r['id'] for r in data['agenda']};oids={r['id'] for r in data['order']}
 data['votes']=[v for v in data['votes'] if v['materia'] in mids and (v['expediente'] in aids or v['ordem'] in oids)]
 vids={v['id'] for v in data['votes']};data['ballots']=[v for v in data['ballots'] if v['votacao'] in vids]
 data['mandates']=[m for m in data['mandates'] if m['legislatura']==4]
 pids={m['parlamentar'] for m in data['mandates']}
 data['people']=[p for p in data['people'] if p['id'] in pids]
 # Do not distribute source IP addresses or internal operator/user metadata.
 for rows in data.values():
  for r in rows:
   for k in ['ip','user','metadata','operadores','ultima_edicao']:r.pop(k,None)
 keep={'materials':'id numero ano tipo ementa data_apresentacao autores em_tramitacao texto_original','people':'id nome_parlamentar nome_completo fotografia ativo','authors':'id nome content_type object_id','types':'id sigla descricao','sessions':'id __str__ data_inicio hora_inicio url_video upload_ata upload_pauta','presence':'id sessao_plenaria parlamentar','votes':'id __str__ numero_votos_sim numero_votos_nao numero_abstencoes materia ordem expediente','ballots':'id voto votacao parlamentar','agenda':'id data_ordem resultado sessao_plenaria materia','order':'id data_ordem resultado sessao_plenaria materia','mandates':'id parlamentar legislatura data_inicio_mandato data_fim_mandato'}
 for key,fields in keep.items():data[key]=[{k:r.get(k) for k in fields.split()} for r in data[key]]
 data['automated']=os.environ.get('GITHUB_ACTIONS')=='true'
 data['updatedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();data['source']=BASE;data['through']=today
 assert data['materials'] and data['people'] and data['sessions']
 target=ROOT/'dist/data.json'
 if target.exists():
  old=json.loads(target.read_text())
  for key in ['materials','sessions','people','votes','ballots','presence','agenda','order']:
   assert len(data[key])>=len(old[key]),'Contagem diminuiu: revisão manual necessária'
 tmp=target.with_suffix('.tmp');tmp.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')));os.replace(tmp,target)
 print('VALIDATED',len(data['materials']),len(data['sessions']),len(data['people']),flush=True)
if __name__=='__main__':main()
