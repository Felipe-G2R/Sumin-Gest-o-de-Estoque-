// ============================================
// DASHBOARD SERVICE — Conectado ao Supabase Real
// ============================================
import { supabase } from '../lib/supabase';

export const dashboardService = {
  async getStats() {
    try {
      const hoje = new Date();
      const trintaDias = new Date();
      trintaDias.setDate(hoje.getDate() + 30);

      // Buscando dados paralelamente para performance
      const [
        { data: produtos, error: errProd },
        { data: movRecentes, error: errMov },
        { data: notificacoes, error: errNotif }
      ] = await Promise.all([
        supabase.from('produtos').select('quantidade_atual, quantidade_minima, data_validade, preco_unitario').eq('ativo', true),
        supabase.from('movimentacoes').select('id, tipo, quantidade, criado_em, motivo, produto:produtos(nome, unidade_medida), usuario:users(nome)').order('criado_em', { ascending: false }).limit(10),
        supabase.from('notificacoes').select('id, tipo, mensagem, criado_em, produto:produtos(nome)').eq('lida', false).order('criado_em', { ascending: false }).limit(20)
      ]);

      if (errProd) console.warn('Erro ao buscar produtos:', errProd);
      if (errMov) console.warn('Erro ao buscar movimentações:', errMov);
      if (errNotif) console.warn('Erro ao buscar notificações:', errNotif);

      let produtosVencidos = 0;
      let produtosVencendo = 0;
      let estoqueBaixo = 0;
      let semEstoque = 0;
      let valorTotalEstoque = 0;

      if (produtos) {
        produtos.forEach(p => {
          const val = p.data_validade ? new Date(p.data_validade) : null;
          const qtd = Number(p.quantidade_atual || 0);
          const min = Number(p.quantidade_minima || 0);
          const preco = Number(p.preco_unitario || 0);

          valorTotalEstoque += (qtd * preco);

          if (val) {
            if (val < hoje) produtosVencidos++;
            else if (val <= trintaDias) produtosVencendo++;
          }

          if (qtd <= 0) semEstoque++;
          else if (qtd <= min) estoqueBaixo++;
        });
      }

      return {
        cards: {
          totalProdutos: produtos?.length || 0,
          produtosVencidos,
          produtosVencendo,
          estoqueBaixo,
          semEstoque,
          valorTotalEstoque
        },
        movimentacoesRecentes: movRecentes || [],
        notificacoesPendentes: notificacoes || []
      };
    } catch (error) {
      console.error('Erro crítico no dashboardService.getStats:', error);
      return {
        cards: { totalProdutos: 0, produtosVencidos: 0, produtosVencendo: 0, estoqueBaixo: 0, semEstoque: 0, valorTotalEstoque: 0 },
        movimentacoesRecentes: [],
        notificacoesPendentes: []
      };
    }
  },

  async getGraficoMovimentacoes() {
    try {
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
      
      const { data: movimentacoes, error } = await supabase
        .from('movimentacoes')
        .select('tipo, quantidade, criado_em')
        .gte('criado_em', seteDiasAtras.toISOString());

      if (error) throw error;

      const dias = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dataStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        
        const doDia = (movimentacoes || []).filter(m => new Date(m.criado_em).toDateString() === d.toDateString());
        
        const entradas = doDia.filter(m => m.tipo === 'ENTRADA').reduce((sum, m) => sum + Number(m.quantidade), 0);
        const saidas = doDia.filter(m => m.tipo === 'SAIDA').reduce((sum, m) => sum + Number(m.quantidade), 0);

        dias.push({ data: dataStr, entradas, saidas });
      }
      return dias;
    } catch (error) {
      console.error('Erro no dashboardService.getGraficoMovimentacoes:', error);
      return [];
    }
  }
};
