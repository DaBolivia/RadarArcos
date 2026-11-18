import pathlib,json
r=pathlib.Path(__file__).resolve().parents[1];d=json.loads((r/'dist/data.json').read_text())
ids=lambda k:{x['id'] for x in d[k]}
for k,v in d.items():
 if isinstance(v,list):assert len(v)==len(ids(k)),k+' tem IDs duplicados'
assert all(set(m['autores'])<=ids('authors') for m in d['materials'])
assert all(m['tipo'] in ids('types') for m in d['materials'])
assert all(v['materia'] in ids('materials') for v in d['votes'])
assert all(v['votacao'] in ids('votes') for v in d['ballots'])
assert all(p['sessao_plenaria'] in ids('sessions') for p in d['presence'])
assert all('2025-01-01'<=m['data_apresentacao']<=d['through'] for m in d['materials'])
assert (r/'dist/assets/logo.png').is_file()
print('OK: IDs únicos, autores, tipos, votos, presenças, datas e logo.')
