import { supabase } from '../lib/supabase';

export const relatorioService = {
  // Consumption report - material usage by period and user
  async getConsumo(dias = 30) {
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - dias);

    const { data, error } = await supabase.from('movimentacoes')
      .select('produto_id, quantidade, criado_em, produto:produtos(nome, unidade_medida, preco_unitario, categoria), usuario:users(nome)')
      .eq('tipo', 'SAIDA')
      .gte('criado_em', dataInicio.toISOString())
      .order('criado_em', { ascending: false })
      .limit(5000);
    if (error) throw error;

    // Aggregate by product
    const porProduto = {};
    (data || []).forEach(mov => {
      const pid = mov.produto_id;
      if (!porProduto[pid]) {
        porProduto[pid] = {
          produto_id: pid,
          nome: mov.produto?.nome || 'N/A',
          categoria: mov.produto?.categoria || 'Sem categoria',
          unidade_medida: mov.produto?.unidade_medida || 'UN',
          preco_unitario: mov.produto?.preco_unitario || 0,
          total_quantidade: 0,
          total_valor: 0,
          movimentacoes: 0,
          usuarios: new Set(),
        };
      }
      const qty = Number(mov.quantidade);
      porProduto[pid].total_quantidade += qty;
      porProduto[pid].total_valor += qty * (mov.produto?.preco_unitario || 0);
      porProduto[pid].movimentacoes++;
      if (mov.usuario?.nome) porProduto[pid].usuarios.add(mov.usuario.nome);
    });

    // Convert Sets to arrays and sort by total value descending
    const resultado = Object.values(porProduto).map(p => ({
      ...p,
      usuarios: [...p.usuarios],
    })).sort((a, b) => b.total_valor - a.total_valor);

    return resultado;
  },

  // ABC Curve classification
  async getCurvaABC(dias = 90) {
    const consumo = await this.getConsumo(dias);
    if (consumo.length === 0) return [];

    const valorTotal = consumo.reduce((sum, p) => sum + p.total_valor, 0);
    if (valorTotal === 0) return consumo.map(p => ({ ...p, classificacao: 'C', percentual: 0, percentual_acumulado: 0 }));

    let acumulado = 0;
    return consumo.map(p => {
      const percentual = (p.total_valor / valorTotal) * 100;
      acumulado += percentual;
      let classificacao = 'C';
      if (acumulado <= 80) classificacao = 'A';
      else if (acumulado <= 95) classificacao = 'B';
      return { ...p, classificacao, percentual, percentual_acumulado: acumulado };
    });
  },

  // Intelligent expiry prediction
  async getPrevisaoVencimento() {
    const noventaDiasAtras = new Date();
    noventaDiasAtras.setDate(noventaDiasAtras.getDate() - 90);

    const [{ data: produtos, error: errProd }, { data: saidas, error: errMov }] = await Promise.all([
      supabase.from('produtos')
        .select('id, nome, data_validade, quantidade_atual, unidade_medida, preco_unitario, categoria')
        .eq('ativo', true)
        .not('data_validade', 'is', null)
        .gt('quantidade_atual', 0),
      supabase.from('movimentacoes')
        .select('produto_id, quantidade')
        .eq('tipo', 'SAIDA')
        .gte('criado_em', noventaDiasAtras.toISOString())
        .limit(5000),
    ]);
    if (errProd) throw errProd;
    if (errMov) throw errMov;

    // Calculate daily consumption per product
    const consumoPorProduto = {};
    (saidas || []).forEach(s => {
      if (!consumoPorProduto[s.produto_id]) consumoPorProduto[s.produto_id] = 0;
      consumoPorProduto[s.produto_id] += Number(s.quantidade);
    });

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return (produtos || []).map(p => {
      const validade = new Date(p.data_validade);
      validade.setHours(0, 0, 0, 0);
      const diasParaVencer = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));

      const consumoTotal90d = consumoPorProduto[p.id] || 0;
      const consumoDiario = consumoTotal90d / 90;
      const diasParaAcabar = consumoDiario > 0 ? Math.ceil(p.quantidade_atual / consumoDiario) : Infinity;

      const vaiVencerAntes = diasParaVencer < diasParaAcabar && diasParaVencer > 0;
      const quantidadeEmRisco = vaiVencerAntes
        ? Math.max(0, p.quantidade_atual - Math.floor(consumoDiario * diasParaVencer))
        : 0;
      const valorEmRisco = quantidadeEmRisco * (p.preco_unitario || 0);

      return {
        ...p,
        dias_para_vencer: diasParaVencer,
        consumo_diario: Math.round(consumoDiario * 100) / 100,
        dias_para_acabar: diasParaAcabar === Infinity ? null : diasParaAcabar,
        vai_vencer_antes: vaiVencerAntes,
        quantidade_em_risco: quantidadeEmRisco,
        valor_em_risco: valorEmRisco,
        status: diasParaVencer <= 0 ? 'VENCIDO' : diasParaVencer <= 7 ? 'CRITICO' : diasParaVencer <= 30 ? 'ALERTA' : 'OK',
      };
    }).sort((a, b) => a.dias_para_vencer - b.dias_para_vencer);
  },

  // Purchase suggestions (auto reorder)
  async getSugestoesCompra() {
    const noventaDiasAtras = new Date();
    noventaDiasAtras.setDate(noventaDiasAtras.getDate() - 90);

    const [{ data: produtos, error: errProd }, { data: saidas, error: errMov }] = await Promise.all([
      supabase.from('produtos')
        .select('id, nome, quantidade_atual, quantidade_minima, unidade_medida, preco_unitario, categoria, fornecedor_id, fornecedor:fornecedores(nome)')
        .eq('ativo', true),
      supabase.from('movimentacoes')
        .select('produto_id, quantidade')
        .eq('tipo', 'SAIDA')
        .gte('criado_em', noventaDiasAtras.toISOString())
        .limit(5000),
    ]);
    if (errProd) throw errProd;
    if (errMov) throw errMov;

    // Aggregate consumption
    const consumoPorProduto = {};
    (saidas || []).forEach(s => {
      if (!consumoPorProduto[s.produto_id]) consumoPorProduto[s.produto_id] = 0;
      consumoPorProduto[s.produto_id] += Number(s.quantidade);
    });

    return (produtos || [])
      .filter(p => p.quantidade_atual <= p.quantidade_minima)
      .map(p => {
        const consumo90d = consumoPorProduto[p.id] || 0;
        const consumoMensal = consumo90d / 3;
        // Suggest: enough for 2 months of consumption OR double the minimum, whichever is greater
        const qtdSugerida = Math.max(
          Math.ceil(consumoMensal * 2),
          (p.quantidade_minima * 2) - p.quantidade_atual
        );
        const custoEstimado = qtdSugerida * (p.preco_unitario || 0);

        return {
          ...p,
          consumo_mensal: Math.round(consumoMensal),
          quantidade_sugerida: Math.max(qtdSugerida, 1),
          custo_estimado: custoEstimado,
          urgencia: p.quantidade_atual === 0 ? 'CRITICA' : p.quantidade_atual <= p.quantidade_minima / 2 ? 'ALTA' : 'MEDIA',
          fornecedor_nome: p.fornecedor?.nome || 'Sem fornecedor',
        };
      })
      .sort((a, b) => {
        const urgMap = { CRITICA: 0, ALTA: 1, MEDIA: 2 };
        return (urgMap[a.urgencia] || 2) - (urgMap[b.urgencia] || 2);
      });
  },

  // Cost per procedure
  async getCustoPorProcedimento(dias = 30) {
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - dias);

    const { data, error } = await supabase.from('movimentacoes')
      .select('quantidade, motivo, produto:produtos(nome, preco_unitario, unidade_medida)')
      .eq('tipo', 'SAIDA')
      .gte('criado_em', dataInicio.toISOString());
    if (error) throw error;

    // Group by motivo (procedure type)
    const porProcedimento = {};
    (data || []).forEach(mov => {
      const proc = mov.motivo || 'Não especificado';
      if (!porProcedimento[proc]) {
        porProcedimento[proc] = { procedimento: proc, total_itens: 0, total_valor: 0, produtos: {} };
      }
      const qty = Number(mov.quantidade);
      const preco = mov.produto?.preco_unitario || 0;
      porProcedimento[proc].total_itens += qty;
      porProcedimento[proc].total_valor += qty * preco;

      const pNome = mov.produto?.nome || 'N/A';
      if (!porProcedimento[proc].produtos[pNome]) {
        porProcedimento[proc].produtos[pNome] = { quantidade: 0, valor: 0 };
      }
      porProcedimento[proc].produtos[pNome].quantidade += qty;
      porProcedimento[proc].produtos[pNome].valor += qty * preco;
    });

    return Object.values(porProcedimento)
      .map(p => ({
        ...p,
        produtos: Object.entries(p.produtos).map(([nome, v]) => ({ nome, ...v })),
      }))
      .sort((a, b) => b.total_valor - a.total_valor);
  },

  // Dashboard charts data - categories distribution
  async getDistribuicaoCategorias() {
    const { data, error } = await supabase.from('produtos')
      .select('categoria, quantidade_atual, preco_unitario')
      .eq('ativo', true);
    if (error) throw error;

    const porCategoria = {};
    (data || []).forEach(p => {
      const cat = p.categoria || 'Sem categoria';
      if (!porCategoria[cat]) porCategoria[cat] = { categoria: cat, quantidade: 0, valor: 0, itens: 0 };
      porCategoria[cat].quantidade += Number(p.quantidade_atual || 0);
      porCategoria[cat].valor += Number(p.quantidade_atual || 0) * Number(p.preco_unitario || 0);
      porCategoria[cat].itens++;
    });

    return Object.values(porCategoria).sort((a, b) => b.valor - a.valor);
  }
};
