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
