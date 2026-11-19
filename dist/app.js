'use strict';

const assetRoot = new URL('.', document.currentScript.src).href;

let D;
const main = document.querySelector('main');

document.querySelector('.skip').onclick = e => {
  e.preventDefault();
  main.focus();
};

const esc = s => String(s ?? '').replace(
  /[&<>"']/g,
  c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c])
);

const norm = s => String(s ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

// Datas dos registros oficiais, sem horário.
const date = s => s
  ? new Date(s.slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR')
  : 'Não informada';

// Data da coleta convertida para o horário de Brasília.
const collectionDate = s => s
  ? new Date(s).toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo'
    })
  : 'Não informada';

const num = n => n.toLocaleString('pt-BR');

const safe = u => {
  try {
    const x = new URL(u.replace(/^http:/, 'https:'));
    return ['https:'].includes(x.protocol) ? esc(x.href) : '#';
  } catch {
    return '#';
  }
};

const ext = (u, t) => u
  ? `<a class="outline" href="${safe(u)}" target="_blank" rel="noopener">${t} ↗</a>`
  : '';

const source = (path, t = 'Conferir na Câmara') => ext(D.source + path, t);
const person = id => D.people.find(p => p.id === id);
const author = id => D.authors.find(a => a.id === id);
const type = id => D.types.find(t => t.id === id);
const material = id => D.materials.find(m => m.id === id);
const title = m => `${type(m.tipo)?.sigla || 'Matéria'} ${m.numero}/${m.ano}`;

const by = m => m.autores
  .map(id => author(id)?.nome || 'Autor não identificado')
  .join(' · ') || 'Autoria não informada';

const sorted = rows => [...rows].sort(
  (a, b) =>
    (b.data_apresentacao || b.data_inicio)
      .localeCompare(a.data_apresentacao || a.data_inicio) ||
    b.id - a.id
);

const personMaterials = p => D.materials.filter(m =>
  m.autores.some(id => {
    const a = author(id);
    return a?.content_type === 2 && a.object_id === p.id;
  })
);

const avatar = p => p.fotografia
  ? `<img class="avatar" loading="lazy" src="${safe(p.fotografia)}" alt="${esc(p.nome_parlamentar)}">`
  : `<span class="avatar initials">${esc(p.nome_parlamentar.slice(0, 2))}</span>`;

function row(m) {
  return `
    <a class="row" href="#materia/${m.id}">
      <div class="row-top">
        <span class="pill">${esc(title(m))}</span>
        <span class="date">${date(m.data_apresentacao)}</span>
      </div>
      <h3>${esc(m.ementa)}</h3>
      <div class="meta">
        <span>${esc(by(m))}</span>
        <span class="textlink">Ver proposta →</span>
      </div>
    </a>
  `;
}

function pcard(p) {
  return `
    <a class="person" href="#vereador/${p.id}">
      ${avatar(p)}
      <h3>${esc(p.nome_parlamentar)}</h3>
      <p>${num(personMaterials(p).length)} matérias de autoria ou coautoria</p>
      <span class="textlink">Conhecer atuação →</span>
    </a>
  `;
}

function shead(eyebrow, heading, desc = '', link = '') {
  return `
    <div class="sectionhead">
      <div>
        <span class="eyebrow">${eyebrow}</span>
        <h2>${heading}</h2>
        <p>${desc}</p>
      </div>
      ${link}
    </div>
  `;
}

function home() {
  main.innerHTML = `
    <section class="hero">
      <div class="hero-inner">
        <div>
          <span class="eyebrow">
            ARCOS • MINAS GERAIS • LEGISLATURA 2025–2028
          </span>
          <h1>
            A sua cidade em pauta.<br>
            <em>O poder de acompanhar.</em>
          </h1>
          <p>
            Saiba o que está sendo proposto, acompanhe os vereadores
            e consulte as decisões da Câmara.
          </p>
          <form id="heroSearch" class="searchbar">
            <input
              aria-label="Buscar bairro, rua ou assunto"
              name="q"
              placeholder="Busque seu bairro, rua ou assunto"
            >
            <button class="primary">Pesquisar ↗</button>
          </form>
          <div class="hero-tags">
            <span>✓ Dados de fontes oficiais</span>
            <span>✓ Acesso livre à informação</span>
          </div>
        </div>
        <div class="logo-panel">
          <img src="${assetRoot}assets/logo.png" alt="Logo Radar Arcos MG">
        </div>
      </div>
    </section>

    <div class="wrap">
      <div class="update">
        <span class="dot"></span>
        Coleta validada em ${collectionDate(D.updatedAt)}
        <span>• Registros de 2025 até ${date(D.through)}</span>
      </div>

      <div class="stats">
        ${[
          [
            D.materials.length,
            'Matérias disponíveis',
            'Todas as autorias, incluindo Executivo'
          ],
          [
            D.people.length,
            'Vereadores na legislatura',
            'Perfis com mandato cadastrado'
          ],
          [
            D.sessions.length,
            'Sessões publicadas',
            'Histórico disponível no SAPL'
          ],
          [
            D.votes.length,
            'Registros de votação',
            'Resultados vinculados às matérias'
          ]
        ].map(([n, t, s]) => `
          <div class="stat">
            <span class="stat-label">${t}</span>
            <strong>${num(n)}</strong>
            <small>${s}</small>
          </div>
        `).join('')}
      </div>

      <div class="homegrid">
        <section>
          ${shead(
            'ATIVIDADE LEGISLATIVA',
            'O que está em discussão',
            'As matérias mais recentes da cidade.',
            '<a class="textlink" href="#propostas">Ver todas →</a>'
          )}
          <div class="panel">
            ${sorted(D.materials).slice(0, 4).map(row).join('')}
          </div>
        </section>

        <aside>
          ${shead('PARTICIPAÇÃO', 'Acompanhe de perto')}
          <div class="side">
            <span class="eyebrow">SEU BAIRRO NO RADAR</span>
            <h3>O que a Câmara discute<br>sobre onde você vive?</h3>
            <p>
              Pesquise locais e assuntos mencionados nas ementas oficiais.
            </p>
            <div class="topics">
              ${[
                'Saúde',
                'Educação',
                'Iluminação',
                'Limpeza',
                'Trânsito',
                'Rua'
              ].map(t => `
                <a class="topic" href="#propostas?q=${encodeURIComponent(t)}">
                  ${t} ↗
                </a>
              `).join('')}
            </div>
            <a href="#propostas" class="primary">Explorar propostas →</a>
          </div>

          <div class="note">
            <strong>Informação com contexto</strong><br>
            Aprovação de uma proposta não significa execução de uma obra.
            Consulte sempre a fonte e a etapa do processo.
          </div>

          <a class="textlink" href="#sobre">Entenda nossos critérios ↗</a>
        </aside>
      </div>

      <section class="gap">
        ${shead(
          'QUEM REPRESENTA ARCOS',
          'Conheça os vereadores',
          'Veja propostas, presenças registradas e votos individuais.',
          '<a class="textlink" href="#vereadores">Ver todos →</a>'
        )}
        <div class="people">
          ${D.people.slice(0, 4).map(pcard).join('')}
        </div>
      </section>
    </div>
  `;

  document.querySelector('#heroSearch').onsubmit = e => {
    e.preventDefault();
    location.hash =
      'propostas?q=' +
      encodeURIComponent(new FormData(e.target).get('q'));
  };
}

function proposals(params) {
  const q = params.get('q') || '';
  const aid = params.get('autor') || '';
  const yr = params.get('ano') || '';
  const tid = params.get('tipo') || '';

  let page = Math.max(1, parseInt(params.get('pagina')) || 1);

  const rows = sorted(D.materials).filter(m =>
    (!q || norm(m.ementa + ' ' + title(m) + ' ' + by(m)).includes(norm(q))) &&
    (!aid || m.autores.includes(+aid)) &&
    (!yr || m.ano === +yr) &&
    (!tid || m.tipo === +tid)
  );

  const pages = Math.max(1, Math.ceil(rows.length / 15));
  page = Math.min(page, pages);

  main.innerHTML = `
    <div class="wrap">
      ${shead(
        'EXPLORE OS REGISTROS',
        'Propostas legislativas',
        'Pesquise por assunto, bairro, rua ou nome. A busca consulta as ementas publicadas.'
      )}

      <form class="filters" id="filters">
        <label>
          Busca
          <input
            name="q"
            value="${esc(q)}"
            placeholder="Ex.: iluminação, saúde, nome de uma rua"
          >
        </label>

        <label>
          Autoria
          <select name="autor">
            <option value="">Todas as autorias</option>
            ${D.authors
              .filter(a => D.materials.some(m => m.autores.includes(a.id)))
              .map(a => `
                <option value="${a.id}" ${aid == a.id ? 'selected' : ''}>
                  ${esc(a.nome)}
                </option>
              `).join('')}
          </select>
        </label>

        <label>
          Ano
          <select name="ano">
            <option value="">Todos os anos</option>
            ${[...new Set(D.materials.map(m => m.ano))]
              .sort((a, b) => b - a)
              .map(n => `
                <option ${yr == n ? 'selected' : ''}>${n}</option>
              `).join('')}
          </select>
        </label>

        <label>
          Tipo
          <select name="tipo">
            <option value="">Todos os tipos</option>
            ${D.types
              .filter(t => D.materials.some(m => m.tipo === t.id))
              .map(t => `
                <option value="${t.id}" ${tid == t.id ? 'selected' : ''}>
                  ${esc(t.descricao)}
                </option>
              `).join('')}
          </select>
        </label>

        <button class="primary">Aplicar filtros</button>
        <a class="outline" href="#propostas">Limpar filtros</a>
      </form>

      <div class="results-count">
        ${num(rows.length)} resultados • Mais recentes primeiro
      </div>

      <div class="panel">
        ${rows.slice((page - 1) * 15, page * 15).map(row).join('') || `
          <div class="empty">
            Nenhuma matéria encontrada. Tente outro termo ou remova os filtros.
            <br>
            Isso não significa que não houve atuação sobre o assunto.
          </div>
        `}
      </div>

      <div class="pagination">
        <button id="prev" ${page === 1 ? 'disabled' : ''}>← Anterior</button>
        <span>${page} de ${pages}</span>
        <button id="next" ${page === pages ? 'disabled' : ''}>Próxima →</button>
      </div>
    </div>
  `;

  document.querySelector('#filters').onsubmit = e => {
    e.preventDefault();
    location.hash = 'propostas?' + new URLSearchParams(new FormData(e.target));
  };

  for (const [id, n] of [['prev', page - 1], ['next', page + 1]]) {
    document.getElementById(id).onclick = () => {
      params.set('pagina', n);
      location.hash = 'propostas?' + params;
    };
  }
}

function sessionForVote(v) {
  const item = v.ordem
    ? D.order.find(a => a.id === v.ordem)
    : D.agenda.find(a => a.id === v.expediente);

  return D.sessions.find(s => s.id === item?.sessao_plenaria);
}

function voting(v) {
  const s = sessionForVote(v);
  const ballots = D.ballots.filter(b => b.votacao === v.id);

  return `
    <section>
      <h3>${esc(v.__str__.split(' - Votação: ').pop())}</h3>

      <p class="meta">
        ${s ? `
          <a href="#sessao/${s.id}">
            ${date(s.data_inicio)} · ${esc(s.__str__)} →
          </a>
        ` : 'Sessão não vinculada'}
      </p>

      <div class="note">
        ${v.numero_votos_sim} votos sim ·
        ${v.numero_votos_nao} votos não ·
        ${v.numero_abstencoes} abstenções
      </div>

      ${ballots.length ? `
        <table>
          <thead>
            <tr><th>Vereador</th><th>Voto registrado</th></tr>
          </thead>
          <tbody>
            ${ballots.map(b => `
              <tr>
                <td>
                  ${person(b.parlamentar) ? `
                    <a href="#vereador/${b.parlamentar}">
                      ${esc(person(b.parlamentar).nome_parlamentar)}
                    </a>
                  ` : 'Parlamentar ' + b.parlamentar}
                </td>
                <td>${esc(b.voto)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p>Votos individuais não disponíveis nesta coleta.</p>'}
    </section>
  `;
}

function detail(id) {
  const m = material(id);
  if (!m) return missing();

  const vs = D.votes.filter(v => v.materia === id);

  const events = [...D.agenda, ...D.order]
    .filter(a => a.materia === id)
    .sort((a, b) => a.data_ordem.localeCompare(b.data_ordem));

  main.innerHTML = `
    <div class="wrap">
      <a class="back" href="#propostas">← Todas as propostas</a>

      <article class="detail">
        <span class="eyebrow">
          ${esc(type(m.tipo)?.descricao || 'Matéria legislativa')}
        </span>

        <h1>${esc(title(m))}</h1>
        <p class="subtitle">Apresentada em ${date(m.data_apresentacao)}</p>

        <h2>Ementa oficial</h2>
        <p>${esc(m.ementa)}</p>

        <h2>Autoria</h2>
        <p>
          ${m.autores.map(id => {
            const a = author(id);
            return a?.content_type === 2 && person(a.object_id)
              ? `<a class="textlink" href="#vereador/${a.object_id}">${esc(a.nome)} →</a>`
              : esc(a?.nome || 'Não informada');
          }).join(' · ') || 'Não informada'}
        </p>

        <p class="meta">
          Indicador do SAPL:
          ${m.em_tramitacao ? 'em tramitação' : 'não marcada como em tramitação'}.
          Esse campo não informa, sozinho, aprovação ou rejeição.
        </p>

        <div class="actions">
          ${source('/materia/' + m.id)}
          ${ext(m.texto_original, 'Documento original')}
          <button class="outline" id="share">Copiar link</button>
        </div>

        <h2>Passagens por sessões</h2>
        ${events.length ? `
          <table>
            <thead>
              <tr><th>Data</th><th>Registro na pauta</th></tr>
            </thead>
            <tbody>
              ${events.map(a => `
                <tr>
                  <td>
                    <a href="#sessao/${a.sessao_plenaria}">
                      ${date(a.data_ordem)} ↗
                    </a>
                  </td>
                  <td>${esc(a.resultado || 'Resultado não informado')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `
          <p>
            Nenhuma passagem por sessão vinculada nesta coleta.
            Consulte a tramitação completa na Câmara.
          </p>
        `}

        <h2>Votações registradas</h2>
        ${vs.map(voting).join('') ||
          '<p>Nenhuma votação vinculada disponível nesta coleta.</p>'}

        <div class="note">
          Uma aprovação legislativa não comprova execução pela Prefeitura.
          A tramitação completa e os anexos estão na fonte oficial.
        </div>
      </article>
    </div>
  `;

  document.querySelector('#share').onclick = async e => {
    try {
      await navigator.clipboard.writeText(location.href);
      e.target.textContent = 'Link copiado ✓';
    } catch {
      e.target.textContent = 'Copie o endereço do navegador';
    }
  };
}

function people() {
  main.innerHTML = `
    <div class="wrap">
      ${shead(
        'LEGISLATURA 2025–2028',
        'Vereadores de Arcos',
        'Perfis vinculados aos mandatos cadastrados no SAPL.'
      )}

      <div class="note">
        As contagens incluem autoria e coautoria.
        Uma matéria conjunta pode aparecer em mais de um perfil.
        Quantidade não é uma medida de qualidade.
      </div>

      <div class="people">${D.people.map(pcard).join('')}</div>
    </div>
  `;
}

function profile(id) {
  const p = person(id);
  if (!p) return missing();

  const ms = sorted(personMaterials(p));
  const ps = D.presence.filter(r => r.parlamentar === id);

  const sessions = [...new Set(ps.map(r => r.sessao_plenaria))]
    .map(id => D.sessions.find(s => s.id === id))
    .filter(Boolean)
    .sort((a, b) => b.data_inicio.localeCompare(a.data_inicio));

  const bs = D.ballots.filter(b => b.parlamentar === id);

  const aid = D.authors.find(
    a => a.content_type === 2 && a.object_id === id
  )?.id;

  main.innerHTML = `
    <div class="wrap">
      <a class="back" href="#vereadores">← Todos os vereadores</a>

      <div class="detail">
        <div class="profilehead">
          ${avatar(p)}
          <div>
            <span class="eyebrow">LEGISLATURA 2025–2028</span>
            <h1>${esc(p.nome_parlamentar)}</h1>
            <p class="subtitle">${esc(p.nome_completo)}</p>
          </div>
        </div>

        <div class="actions">
          ${source('/parlamentar/' + id, 'Perfil oficial')}
        </div>

        <div class="stats" style="grid-template-columns:repeat(3,1fr)">
          ${[
            [ms.length, 'Matérias'],
            [sessions.length, 'Presenças registradas'],
            [bs.length, 'Votos registrados']
          ].map(([n, t]) => `
            <div class="stat">
              <span class="stat-label">${t}</span>
              <strong>${num(n)}</strong>
            </div>
          `).join('')}
        </div>

        <h2>Propostas recentes</h2>
        <div class="panel">
          ${ms.slice(0, 6).map(row).join('') ||
            '<p class="empty">Sem matérias vinculadas.</p>'}
        </div>

        ${aid ? `
          <p>
            <a class="textlink" href="#propostas?autor=${aid}">
              Ver todas as ${ms.length} matérias →
            </a>
          </p>
        ` : ''}

        <h2>Presenças publicadas</h2>
        <div class="note">
          Exibimos somente presenças registradas.
          Ausência de registro não é contada como falta.
          Percentuais não são calculados nesta versão.
        </div>

        <details>
          <summary>Consultar ${sessions.length} sessões com presença</summary>
          ${sessions.map(s => `
            <p>
              <a class="textlink" href="#sessao/${s.id}">
                ${date(s.data_inicio)} · ${esc(s.__str__)}
              </a>
            </p>
          `).join('')}
        </details>

        <h2>Votos individuais</h2>
        <p class="subtitle">
          Os 30 registros mais recentes, pela data da sessão.
        </p>

        <table>
          <thead>
            <tr><th>Matéria</th><th>Data</th><th>Voto</th></tr>
          </thead>
          <tbody>
            ${bs
              .map(b => ({
                ...b,
                record: D.votes.find(v => v.id === b.votacao)
              }))
              .sort((a, b) =>
                (sessionForVote(b.record)?.data_inicio || '')
                  .localeCompare(sessionForVote(a.record)?.data_inicio || '')
              )
              .slice(0, 30)
              .map(b => {
                const m = material(b.record.materia);
                return `
                  <tr>
                    <td>
                      <a class="textlink" href="#materia/${m.id}">
                        ${esc(title(m))}
                      </a>
                    </td>
                    <td>${date(sessionForVote(b.record)?.data_inicio)}</td>
                    <td>${esc(b.voto)}</td>
                  </tr>
                `;
              }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function sessions(params) {
  const year = params.get('ano') || '';

  const ss = sorted(D.sessions).filter(
    s => !year || s.data_inicio.startsWith(year)
  );

  main.innerHTML = `
    <div class="wrap">
      ${shead(
        'AGENDA LEGISLATIVA',
        'Sessões da Câmara',
        'Pautas, documentos, presenças e votações publicadas.'
      )}

      <div class="topics">
        <a class="topic" href="#sessoes">Todos os anos</a>
        <a class="topic" href="#sessoes?ano=2026">2026</a>
        <a class="topic" href="#sessoes?ano=2025">2025</a>
      </div>

      <p class="results-count">${ss.length} sessões disponíveis</p>

      <div class="session-grid">
        ${ss.map(s => `
          <a class="session" href="#sessao/${s.id}">
            <span class="eyebrow">
              ${date(s.data_inicio)} • ${esc(s.hora_inicio)}
            </span>
            <h3>${esc(s.__str__)}</h3>
            <p class="meta">
              ${D.presence.filter(p => p.sessao_plenaria === s.id).length}
              registros de presença
            </p>
            <span class="textlink">Ver sessão →</span>
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

function sessionDetail(id) {
  const s = D.sessions.find(s => s.id === id);
  if (!s) return missing();

  const ps = D.presence.filter(p => p.sessao_plenaria === id);

  const items = [...D.agenda, ...D.order].filter(
    a => a.sessao_plenaria === id
  );

  main.innerHTML = `
    <div class="wrap">
      <a class="back" href="#sessoes">← Todas as sessões</a>

      <article class="detail">
        <span class="eyebrow">
          ${date(s.data_inicio)} • ${esc(s.hora_inicio)}
        </span>

        <h1>${esc(s.__str__)}</h1>

        <div class="actions">
          ${source('/sessao/' + id + '/resumo', 'Resumo oficial')}
          ${ext(s.upload_ata, 'Ata')}
          ${ext(s.upload_pauta, 'Pauta')}
          ${ext(s.url_video, 'Vídeo da sessão')}
        </div>

        <h2>Presenças registradas</h2>
        ${ps.length ? `
          <div class="topics">
            ${ps.map(p => person(p.parlamentar)
              ? `
                <a class="topic" href="#vereador/${p.parlamentar}">
                  ${esc(person(p.parlamentar).nome_parlamentar)} ✓
                </a>
              `
              : `<span class="topic">Parlamentar ${p.parlamentar}</span>`
            ).join('')}
          </div>
        ` : '<p>Não há lista de presença disponível nesta coleta.</p>'}

        <p class="meta">
          Um nome não listado não significa falta confirmada.
        </p>

        <h2>Matérias na sessão</h2>
        <div class="panel">
          ${items.map(a => {
            const m = material(a.materia);
            return m
              ? `
                <div>
                  <p class="note">${esc(a.resultado || 'Resultado não informado')}</p>
                  ${row(m)}
                </div>
              `
              : `
                <p class="row">
                  Matéria fora do período coletado.
                  ${source('/materia/' + a.materia, 'Consultar matéria')}
                </p>
              `;
          }).join('') || `
            <p class="empty">
              Pauta estruturada não disponível. Consulte o resumo oficial.
            </p>
          `}
        </div>
      </article>
    </div>
  `;
}

function about() {
  main.innerHTML = `
    <div class="wrap">
      ${shead(
        'TRANSPARÊNCIA DO RADAR',
        'Dados abertos, critérios claros',
        'Entenda o que os números mostram e quais são os limites.'
      )}

      <article class="detail">
        <h2>Um projeto independente</h2>
        <p>
          O Radar Arcos facilita a consulta de informações públicas
          da Câmara Municipal. Não é um portal oficial nem atribui
          notas aos vereadores.
        </p>

        <h2>Fonte e período</h2>
        <p>
          Os registros vêm da API pública do SAPL de Arcos.
          Esta versão reúne matérias e sessões desde 01/01/2025
          até ${date(D.through)}.
          A coleta foi concluída em
          ${new Date(D.updatedAt).toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo'
          })}
          (horário de Brasília).
        </p>

        ${source('/', 'Abrir SAPL')}

        <h2>Como contamos</h2>
        <ul>
          <li>
            Matérias: registros únicos pelo identificador oficial,
            incluindo Executivo, comissões e vereadores.
          </li>
          <li>
            Autoria: identificadores de autor vinculados ao parlamentar.
            Coautoria é contada em cada perfil, sem duplicar o total geral.
          </li>
          <li>
            Sessões: registros publicados no período.
            Não comprovam, por si só, cobertura de todas as reuniões realizadas.
          </li>
          <li>
            Votações: cada registro de votação é contado uma vez.
            Uma matéria pode ser votada em mais de um turno ou sessão.
          </li>
        </ul>

        <h2>Presença e votos</h2>
        <p>
          Exibimos presenças publicadas, sem transformar registros ausentes
          em faltas. Não calculamos percentuais enquanto afastamentos,
          substituições e cobertura não forem validados.
          “Não Votou” é reproduzido como registrado e não equivale
          automaticamente a ausência.
        </p>

        <h2>Busca por local e assunto</h2>
        <p>
          A busca ignora acentos e maiúsculas e consulta ementa,
          identificação e autoria. Não lê o conteúdo dos PDFs.
          Não encontrar uma rua ou bairro não comprova ausência de atuação.
          Os atalhos de assunto são buscas por palavras,
          não classificação automática.
        </p>

        <h2>Situação e execução</h2>
        <p>
          Mostramos resultados das pautas e votações vinculadas.
          O indicador “em tramitação” é reproduzido sem inferir aprovação.
          A tramitação integral permanece acessível na fonte.
          Aprovação não comprova realização de uma obra
          ou atendimento de um pedido.
        </p>

        <h2>Atualização e integridade</h2>
        <p>
          O coletor percorre todas as páginas e confere contagens
          e identificadores antes de substituir a base.
          Falhas preservam a última versão válida.
          ${D.automated
            ? 'Esta base foi produzida pela rotina do GitHub. Confira a data da última coleta para verificar a atualização.'
            : 'A execução diária no GitHub e o envio à Vercel estão preparados para configuração; ainda não estão ativados nesta prévia.'}
        </p>

        <h2>Coleta diária e análise semanal</h2>
        <p>
          A coleta por código está preparada para execução diária às 4h17
          (horário de Brasília), após configuração no GitHub e na Vercel.
          O responsável recebe um boletim semanal de análise na
          segunda-feira pela manhã, separado da base oficial.
          O boletim é entregue para revisão e não é publicado
          automaticamente neste site.
        </p>

        <h2>Encontrou uma divergência?</h2>
        <p>
          Compare o registro com o link oficial exibido em cada página
          e informe ao responsável pelo Radar o endereço da página
          e a correção necessária.
          Se o erro estiver na fonte, a retificação deve ser solicitada à Câmara.
        </p>

        ${ext('https://www.arcos.mg.leg.br/', 'Site da Câmara')}
      </article>
    </div>
  `;
}

function missing() {
  main.innerHTML = `
    <div class="wrap empty">
      <h1>Registro não encontrado</h1>
      <p>O endereço não corresponde a um registro desta coleta.</p>
      <a class="textlink" href="#inicio">Voltar ao início →</a>
    </div>
  `;
}

function render() {
  const [route, query = ''] = location.hash.slice(1).split('?');
  const [page, id] = route.split('/');
  const params = new URLSearchParams(query);

  document.querySelectorAll('nav a').forEach(a => {
    a.classList.toggle('active', a.hash === '#' + (page || 'inicio'));
  });

  if (!page || page === 'inicio') home();
  else if (page === 'propostas') proposals(params);
  else if (page === 'materia') detail(+id);
  else if (page === 'vereadores') people();
  else if (page === 'vereador') profile(+id);
  else if (page === 'sessoes') sessions(params);
  else if (page === 'sessao') sessionDetail(+id);
  else if (page === 'sobre') about();
  else missing();

  document.title =
    (main.querySelector('h1,h2')?.textContent || 'A cidade em pauta') +
    ' · Radar Arcos';

  window.scrollTo(0, 0);
}

fetch(assetRoot + 'data.json')
  .then(r => {
    if (!r.ok) throw Error('Dados indisponíveis');
    return r.json();
  })
  .then(data => {
    D = data;
    render();
    window.addEventListener('hashchange', render);
  })
  .catch(() => {
    main.innerHTML = `
      <div class="empty">
        <h1>Não foi possível carregar os dados</h1>
        <p>Atualize a página para tentar novamente ou consulte o SAPL.</p>
        <a class="primary" href="https://sapl.arcos.mg.leg.br/">
          Abrir fonte oficial ↗
        </a>
      </div>
    `;
  });


// Contador estimado de subsídios — Radar Arcos
(() => {
  // O teste de páginas não possui observador de DOM.
  if (typeof MutationObserver === 'undefined') return;

  const VAGAS = 9;

  // Valores mensais por cargo, em reais.
  // Atualizar esta tabela após conferir novas resoluções.
  const PERIODOS = [
    { ano: 2025, mensal: 5740.52 },
    { ano: 2026, mensal: 5964.40 }
  ];

  // Não projeta valores para anos ainda não conferidos.
  const LIMITE = Date.parse('2027-01-01T00:00:00-03:00');

  const moeda = valor => valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  const dataBrasilia = instante =>
    new Date(instante).toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo'
    });

  let ultimoValor = '';

  function calcular(instante) {
    let porCargo = 0;

    for (const periodo of PERIODOS) {
      for (let mes = 0; mes < 12; mes++) {
        // Meia-noite de Brasília corresponde a 03:00 UTC.
        const inicio = Date.UTC(periodo.ano, mes, 1, 3);
        const fim = Date.UTC(periodo.ano, mes + 1, 1, 3);

        const fracao = Math.max(
          0,
          Math.min(1, (instante - inicio) / (fim - inicio))
        );

        porCargo += periodo.mensal * fracao;
      }
    }

    return {
      individual: porCargo,
      total: porCargo * VAGAS
    };
  }

  function atualizar() {
    const bloco = document.getElementById('radar-subsidios');
    if (!bloco) return;

    const agora = Date.now();
    const valores = calcular(Math.min(agora, LIMITE));
    const novoValor = moeda(valores.total);
    const numero = bloco.querySelector('[data-total]');

    if (novoValor !== ultimoValor) {
      numero.textContent = novoValor;

      if (
        ultimoValor &&
        typeof numero.animate === 'function' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        numero.animate(
          [
            { transform: 'translateY(3px)', opacity: 0.75 },
            { transform: 'translateY(0)', opacity: 1 }
          ],
          { duration: 220, easing: 'ease-out' }
        );
      }

      ultimoValor = novoValor;
    }

    bloco.querySelector('[data-individual]').textContent =
      moeda(valores.individual);

    const ano = Number(
      new Date(agora).toLocaleDateString('en-US', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric'
      })
    );

    const periodo = PERIODOS.find(item => item.ano === ano);

    bloco.querySelector('[data-mensal]').textContent =
      periodo ? moeda(periodo.mensal) : 'A conferir';

    bloco.querySelector('[data-status]').textContent =
      agora >= LIMITE
        ? 'Estimativa até 31/12/2026. Aguardando conferência dos valores de 2027.'
        : `Desde 01/01/2025 até ${dataBrasilia(agora)} · horário de Brasília`;
  }

  function montar() {
    const pagina = document.querySelector('main');
    if (!pagina) return;

    const banner = pagina.querySelector('.hero');
    if (!banner || pagina.querySelector('#radar-subsidios')) return;

    const bloco = document.createElement('section');
    bloco.id = 'radar-subsidios';
    bloco.className = 'wrap';
    bloco.setAttribute('aria-labelledby', 'radar-subsidios-titulo');

    bloco.innerHTML = `
      <style>
        #radar-subsidios {
          margin-top: 28px;
          margin-bottom: 28px;
        }

        #radar-subsidios .salario-painel {
          padding: clamp(22px, 4vw, 42px);
          border-radius: 20px;
          border: 1px solid #274c60;
          background: linear-gradient(125deg, #102f43, #17495a);
          color: #ffffff;
          box-shadow: 0 12px 30px rgba(16, 47, 67, 0.10);
        }

        #radar-subsidios .salario-etiqueta {
          color: #8edbd2;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        #radar-subsidios h2 {
          margin: 12px 0 8px;
          color: #ffffff;
          font-size: clamp(21px, 3vw, 30px);
        }

        #radar-subsidios .salario-periodo {
          color: #d3e2e9;
          font-size: 13px;
        }

        #radar-subsidios .salario-total {
          display: block;
          margin: 22px 0 8px;
          color: #ffffff;
          font-size: clamp(27px, 6vw, 64px);
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -1px;
          font-variant-numeric: tabular-nums;
          overflow-wrap: anywhere;
        }

        #radar-subsidios .salario-legenda {
          margin: 0;
          color: #d3e2e9;
          font-size: 14px;
        }

        #radar-subsidios .salario-detalhes {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-top: 24px;
          padding-top: 22px;
          border-top: 1px solid rgba(255, 255, 255, 0.18);
        }

        #radar-subsidios .salario-detalhes span {
          display: block;
          color: #d3e2e9;
          font-size: 12px;
        }

        #radar-subsidios .salario-detalhes strong {
          display: block;
          margin-top: 6px;
          font-size: clamp(18px, 3vw, 25px);
          font-variant-numeric: tabular-nums;
        }

        #radar-subsidios .salario-nota {
          margin: 22px 0 0;
          color: #d3e2e9;
          font-size: 13px;
          line-height: 1.6;
        }

        #radar-subsidios details {
          margin-top: 18px;
          color: #e5eef3;
          font-size: 13px;
          line-height: 1.7;
        }

        #radar-subsidios summary {
          cursor: pointer;
          font-weight: 600;
        }

        #radar-subsidios a {
          color: #a7eee4;
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          #radar-subsidios .salario-detalhes {
            grid-template-columns: 1fr;
          }
        }
      </style>

      <div class="salario-painel">
        <span class="salario-etiqueta">
          Transparência · Legislatura 2025–2028
        </span>

        <h2 id="radar-subsidios-titulo">
          Subsídios dos vereadores — estimativa acumulada
        </h2>

        <p class="salario-periodo" data-status></p>

        <strong class="salario-total" data-total aria-live="off">
          Calculando…
        </strong>

        <p class="salario-legenda">
          Total estimado de subsídios-base para os 9 cargos.
        </p>

        <div class="salario-detalhes">
          <div>
            <span>Acumulado estimado por cargo</span>
            <strong data-individual>—</strong>
          </div>

          <div>
            <span>Subsídio-base mensal por cargo no ano atual</span>
            <strong data-mensal>—</strong>
          </div>
        </div>

        <p class="salario-nota">
          Estimativa proporcional ao tempo, atualizada a cada segundo.
          Não representa pagamentos efetivamente realizados.
          Não inclui 13º, adicional de férias, encargos, diárias
          ou descontos.
        </p>

        <details>
          <summary>Como calculamos e fontes oficiais</summary>

          <p>
            Consideramos 9 cargos ocupados continuamente desde
            01/01/2025. Somamos os meses completos e a fração
            transcorrida do mês atual, usando a duração real de
            cada mês no horário de Brasília.
          </p>

          <p>
            Base mensal por cargo: R$ 5.740,52 em 2025.
            Para 2026, aplicamos a recomposição de 3,9%,
            com efeitos desde 01/01/2026, resultando em
            R$ 5.964,40 após arredondamento aos centavos.
          </p>

          <p>
            O valor por cargo não é uma afirmação sobre quanto
            cada pessoa recebeu. A estimativa não ajusta
            afastamentos, vacâncias ou descontos por faltas.
            O relógio usado é o do dispositivo do visitante.
          </p>

          <p>
            A animação distribui o valor mensal ao longo do tempo;
            não indica pagamentos a cada segundo.
            As resoluções salariais precisam de revisão própria:
            a coleta diária de matérias não atualiza esta tabela.
            Sem novos valores conferidos, o contador para
            no encerramento de 2026.
          </p>

          <p>
            Fontes:
            <a
              href="https://sapl.arcos.mg.leg.br/media/sapl/public/normajuridica/2023/3434/resolucao_901.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >Resolução 901/2023</a>
            e
            <a
              href="https://sapl.arcos.mg.leg.br/media/sapl/public/normajuridica/2026/4726/resolucao_916.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >Resolução 916/2026</a>.
          </p>
        </details>
      </div>
    `;

    banner.insertAdjacentElement('afterend', bloco);
    ultimoValor = '';
    atualizar();
  }

  const pagina = document.querySelector('main');
  if (!pagina) return;

  const observador = new MutationObserver(montar);

  // Detecta quando a página inicial é renderizada.
  observador.observe(pagina, { childList: true });

  montar();

  window.setInterval(() => {
    if (!document.hidden) atualizar();
  }, 1000);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) atualizar();
  });
})();

// Rankings do Radar Arcos — com fotos dos vereadores
(() => {
  if (typeof MutationObserver === 'undefined') return;

  const host = document.querySelector('main');
  if (!host) return;

  let categoria = 'propostas';
  let ano = '';

  const limpar = texto => String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  function homenagem(m) {
    const sigla = D.types.find(t => t.id === m.tipo)?.sigla;
    const texto = limpar(m.ementa);

    return (
      sigla === 'PDL' &&
      /\bconcessao\b/.test(texto) &&
      /\b(honorari[oa]|honraria|medalha|aplausos|honrosa|honra ao merito|boina de ouro)\b/.test(texto) &&
      !/\b(altera|revoga|regulamenta)\b/.test(texto)
    );
  }

  function fotoVereador(pessoa) {
    const nome = pessoa.nome_parlamentar || 'Vereador';

    const iniciais = nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(parte => parte.charAt(0))
      .join('')
      .toUpperCase();

    let url = '';

    if (pessoa.fotografia) {
      try {
        const endereco = new URL(
          pessoa.fotografia,
          'https://sapl.arcos.mg.leg.br/'
        );

        if (endereco.protocol === 'http:') {
          endereco.protocol = 'https:';
        }

        if (endereco.protocol === 'https:') {
          url = endereco.href;
        }
      } catch {
        url = '';
      }
    }

    return `
      <span class="rk-photo" aria-hidden="true">
        <span class="rk-initials">${esc(iniciais)}</span>
        ${url ? `
          <img
            src="${esc(url)}"
            alt=""
            loading="lazy"
            decoding="async"
            width="48"
            height="48"
          >
        ` : ''}
      </span>
    `;
  }

  function listar() {
    const unicas = [
      ...new Map(D.materials.map(m => [m.id, m])).values()
    ];

    return D.people.map(p => {
      const autores = new Set(
        D.authors
          .filter(a =>
            a.content_type === 2 &&
            a.object_id === p.id
          )
          .map(a => a.id)
      );

      const materias = unicas
        .filter(m =>
          (!ano || String(m.ano) === ano) &&
          m.autores.some(id => autores.has(id)) &&
          (categoria !== 'homenagens' || homenagem(m))
        )
        .sort((a, b) =>
          (b.data_apresentacao || '')
            .localeCompare(a.data_apresentacao || '') ||
          b.id - a.id
        );

      return {
        pessoa: p,
        materias,
        quantidade: materias.length
      };
    }).sort((a, b) =>
      b.quantidade - a.quantidade ||
      a.pessoa.nome_parlamentar.localeCompare(
        b.pessoa.nome_parlamentar,
        'pt-BR'
      )
    );
  }

  function desenhar(bloco) {
    const anos = [...new Set(D.materials.map(m => m.ano))]
      .sort((a, b) => b - a);

    const data = new Date(D.updatedAt).toLocaleDateString(
      'pt-BR',
      { timeZone: 'America/Sao_Paulo' }
    );

    bloco.innerHTML = `
      <style>
        #radar-rankings {
          margin: 32px 0;
          color: #123247;
        }

        #radar-rankings .rk-card {
          background: #ffffff;
          border: 1px solid #dbe5ec;
          border-radius: 18px;
          padding: clamp(18px, 3vw, 32px);
        }

        #radar-rankings h2 {
          margin: 0 0 10px;
          font-size: clamp(24px, 4vw, 34px);
        }

        #radar-rankings p {
          line-height: 1.6;
        }

        #radar-rankings .rk-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin: 22px 0;
        }

        #radar-rankings label {
          display: grid;
          gap: 6px;
          font-size: 14px;
          flex: 1;
          min-width: 180px;
        }

        #radar-rankings select {
          width: 100%;
          padding: 12px;
          border: 1px solid #b7cbd6;
          border-radius: 9px;
          background: #ffffff;
          color: #123247;
          font: inherit;
        }

        #radar-rankings .rk-note {
          padding: 14px;
          background: #f0f6f8;
          border-radius: 10px;
          font-size: 14px;
          line-height: 1.6;
        }

        #radar-rankings .rk-row {
          padding: 20px 0;
          border-bottom: 1px solid #e4ebef;
        }

        #radar-rankings .rk-row:last-child {
          border-bottom: 0;
        }

        #radar-rankings .rk-top {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        #radar-rankings .rk-rank {
          width: 35px;
          flex: 0 0 35px;
          font-weight: 700;
          font-size: 15px;
        }

        #radar-rankings .rk-name {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
          font-weight: 700;
          color: #123247;
          text-decoration: none;
        }

        #radar-rankings .rk-name:hover .rk-person-name {
          text-decoration: underline;
        }

        #radar-rankings .rk-person-name {
          min-width: 0;
          overflow-wrap: anywhere;
          line-height: 1.35;
        }

        #radar-rankings .rk-photo {
          position: relative;
          display: block;
          width: 48px;
          height: 48px;
          flex: 0 0 48px;
          overflow: hidden;
          border-radius: 50%;
          background: #eaf0f3;
          border: 2px solid #dbe5ec;
        }

        #radar-rankings .rk-initials {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #155e75;
          font-size: 16px;
          font-weight: 700;
        }

        #radar-rankings .rk-photo img {
          position: absolute;
          inset: 0;
          display: block;
          width: 100%;
          height: 100%;
          max-width: none;
          margin: 0;
          border: 0;
          border-radius: 50%;
          object-fit: cover;
          object-position: center top;
          background: #eaf0f3;
        }

        #radar-rankings .rk-photo img[hidden] {
          display: none;
        }

        #radar-rankings .rk-count {
          flex-shrink: 0;
          font-size: 26px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }

        #radar-rankings .rk-bar {
          height: 6px;
          background: #eaf0f3;
          border-radius: 6px;
          overflow: hidden;
          margin: 14px 0 12px;
        }

        #radar-rankings .rk-bar span {
          display: block;
          height: 100%;
          background: #239b88;
          border-radius: 6px;
        }

        #radar-rankings details {
          margin-top: 10px;
          font-size: 14px;
        }

        #radar-rankings summary {
          cursor: pointer;
          font-weight: 600;
        }

        #radar-rankings .rk-items {
          max-height: 360px;
          overflow: auto;
          margin-top: 12px;
          padding: 0 8px 0 24px;
        }

        #radar-rankings .rk-items li {
          padding: 10px 0;
          line-height: 1.5;
        }

        #radar-rankings .rk-items a {
          color: #155e75;
          text-decoration: underline;
        }

        #radar-rankings .rk-small {
          font-size: 14px;
          color: #4c6474;
        }

        #radar-rankings .rk-pending {
          padding: 24px 0;
        }

        @media (max-width: 480px) {
          #radar-rankings .rk-top {
            gap: 8px;
          }

          #radar-rankings .rk-rank {
            width: 27px;
            flex-basis: 27px;
            font-size: 14px;
          }

          #radar-rankings .rk-name {
            gap: 9px;
          }

          #radar-rankings .rk-photo {
            width: 38px;
            height: 38px;
            flex-basis: 38px;
          }

          #radar-rankings .rk-initials {
            font-size: 14px;
          }

          #radar-rankings .rk-count {
            font-size: 23px;
          }
        }
      </style>

      <div class="rk-card">
        <span class="eyebrow">DADOS PARA ACOMPANHAR</span>

        <h2>Vereadores em números</h2>

        <p>
          Compare quantidades e confira os registros.
          Os números não avaliam a qualidade ou o impacto
          do trabalho parlamentar.
        </p>

        <div class="rk-controls">
          <label>
            Indicador
            <select data-rk-category>
              <option
                value="propostas"
                ${categoria === 'propostas' ? 'selected' : ''}
              >
                Mais propostas apresentadas
              </option>

              <option
                value="homenagens"
                ${categoria === 'homenagens' ? 'selected' : ''}
              >
                Mais homenagens propostas
              </option>

              <option
                value="diarias"
                ${categoria === 'diarias' ? 'selected' : ''}
              >
                Diárias pagas — dados pendentes
              </option>
            </select>
          </label>

          <label>
            Período legislativo
            <select
              data-rk-year
              ${categoria === 'diarias' ? 'disabled' : ''}
            >
              <option value="">Todo o período coletado</option>

              ${anos.map(a => `
                <option
                  value="${a}"
                  ${ano === String(a) ? 'selected' : ''}
                >${a}</option>
              `).join('')}
            </select>
          </label>
        </div>

        <div data-rk-body></div>
      </div>
    `;

    const body = bloco.querySelector('[data-rk-body]');

    if (categoria === 'diarias') {
      body.innerHTML = `
        <div class="rk-pending">
          <h3>
            Diárias pagas: aguardando dados oficiais validados
          </h3>

          <p>
            A relação de pagamentos por beneficiário ainda
            não foi integrada. Não há ranking financeiro
            disponível; isso não significa gasto zero.
          </p>

          <p>
            O critério será o total de diárias efetivamente
            pagas por vereador no período, descontadas as
            devoluções identificadas e sem misturar passagens,
            adiantamentos ou despesas de servidores.
          </p>

          <a
            class="outline"
            href="https://www.arcos.mg.leg.br/transparencia/diarias-1"
            target="_blank"
            rel="noopener noreferrer"
          >Consultar diárias na fonte oficial</a>
        </div>
      `;
    } else {
      const lista = listar();

      const maximo = Math.max(
        1,
        ...lista.map(r => r.quantidade)
      );

      let posicao = 0;
      let anterior = null;

      body.innerHTML = `
        <p class="rk-note">
          ${categoria === 'homenagens'
            ? `Homenagens identificadas por regra na ementa:
               projetos de decreto legislativo que concedem
               títulos honorários, honrarias, medalhas e
               moções honrosas ou de aplausos.
               São propostas apresentadas, não necessariamente
               aprovadas. A classificação pode precisar
               de revisão.`
            : `Contagem de matérias de autoria ou coautoria
               individual cadastrada no SAPL, incluindo
               requerimentos, indicações, projetos, emendas
               e outros tipos. Não corresponde apenas a
               projetos de lei nem a propostas aprovadas.`}

          Cada matéria conta uma vez por vereador.
          Coautorias contam para cada autor; autoria de
          comissão ou Mesa não é atribuída automaticamente
          aos seus membros.
          Empates compartilham a mesma posição.
        </p>

        <p class="rk-small">
          ${ano ? `Ano ${ano}` : 'Desde 2025'}
          · Coleta legislativa: ${data}
          · Cobertura até ${date(D.through)}.
        </p>

        ${lista.map((r, i) => {
          if (r.quantidade !== anterior) {
            posicao = i + 1;
          }

          anterior = r.quantidade;

          return `
            <article class="rk-row">
              <div class="rk-top">
                <span class="rk-rank">
                  ${r.quantidade ? posicao + 'º' : '—'}
                </span>

                <a
                  class="rk-name"
                  href="#vereador/${r.pessoa.id}"
                >
                  ${fotoVereador(r.pessoa)}

                  <span class="rk-person-name">
                    ${esc(r.pessoa.nome_parlamentar)}
                  </span>
                </a>

                <span class="rk-count">
                  ${r.quantidade}
                </span>
              </div>

              <div class="rk-bar" aria-hidden="true">
                <span
                  style="width:${r.quantidade / maximo * 100}%"
                ></span>
              </div>

              <span class="rk-small">
                ${categoria === 'homenagens'
                  ? 'homenagens identificadas'
                  : 'matérias de autoria ou coautoria'}
              </span>

              ${r.quantidade ? `
                <details>
                  <summary>
                    Ver os ${r.quantidade} registros
                  </summary>

                  <ol class="rk-items">
                    ${r.materias.map(m => `
                      <li>
                        <a href="#materia/${m.id}">
                          ${esc(title(m))}
                        </a>
                        · ${date(m.data_apresentacao)}

                        <p>${esc(m.ementa)}</p>
                      </li>
                    `).join('')}
                  </ol>
                </details>
              ` : `
                <p class="rk-small">
                  Nenhum registro encontrado neste recorte.
                </p>
              `}
            </article>
          `;
        }).join('')}
      `;
    }

    // Se a foto estiver indisponível, mantém as iniciais.
    bloco.querySelectorAll('.rk-photo img').forEach(img => {
      const mostrarIniciais = () => {
        img.hidden = true;
      };

      img.addEventListener('error', mostrarIniciais, {
        once: true
      });

      if (img.complete && img.naturalWidth === 0) {
        mostrarIniciais();
      }
    });

    bloco.querySelector('[data-rk-category]').onchange = e => {
      categoria = e.target.value;
      desenhar(bloco);
    };

    bloco.querySelector('[data-rk-year]').onchange = e => {
      ano = e.target.value;
      desenhar(bloco);
    };
  }

  function montar() {
    if (
      typeof D === 'undefined' ||
      !D ||
      host.querySelector('#radar-rankings')
    ) {
      return;
    }

    const destino = host.querySelector('.homegrid');
    if (!destino) return;

    const bloco = document.createElement('section');
    bloco.id = 'radar-rankings';

    bloco.setAttribute(
      'aria-label',
      'Rankings de atividade parlamentar'
    );

    destino.insertAdjacentElement('beforebegin', bloco);
    desenhar(bloco);
  }

  const observer = new MutationObserver(montar);
  observer.observe(host, { childList: true });

  montar();
})();
