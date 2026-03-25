// Script para popular o banco com dados realistas de teste
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dwlaygqmbzidlwzyzkiv.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3bGF5Z3FtYnppZGx3enl6a2l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxOTA1MDYsImV4cCI6MjA4OTc2NjUwNn0.MntxyErKUirZsm40GbxO5t2lkwzDp4IviXMOOab7CBQ";

async function run() {
  const sb = createClient(SUPABASE_URL, ANON_KEY);

  const { data: auth, error: authErr } = await sb.auth.signInWithPassword({
    email: "lemescoproduto@gmail.com", password: "123456789"
  });
  if (authErr) { console.log("❌ Login falhou:", authErr.message); return; }
  const uid = auth.user.id;
  console.log("✅ Logado\n");

  // === LOCAIS ===
  console.log("--- LOCAIS ---");
  const { data: locais, error: le } = await sb.from("locais").insert([
    { nome: "Consultório 01", tipo: "SALA", descricao: "Consultório principal com 2 cadeiras" },
    { nome: "Consultório 02", tipo: "SALA", descricao: "Consultório secundário" },
    { nome: "Depósito Central", tipo: "DEPOSITO", descricao: "Depósito principal de materiais" },
    { nome: "Armário Insumos", tipo: "ARMARIO", descricao: "Armário de insumos descartáveis" },
    { nome: "Filial Paraty", tipo: "FILIAL", descricao: "Unidade de Paraty" },
  ]).select();
  console.log(le ? "❌ " + le.message : "✅ " + locais.length + " locais");

  // === FORNECEDORES ===
  console.log("\n--- FORNECEDORES ---");
  const { data: forns, error: fe } = await sb.from("fornecedores").insert([
    { nome: "Dental Cremer", cnpj: "45.232.163/0001-05", telefone: "(11) 3333-4444", email: "vendas@dentalcremer.com.br", endereco: "Av. Paulista, 1000 - SP" },
    { nome: "Dental Speed", cnpj: "12.345.678/0001-90", telefone: "(21) 2222-3333", email: "contato@dentalspeed.com", endereco: "Rua da Assembleia, 50 - RJ" },
    { nome: "Surya Dental", cnpj: "98.765.432/0001-10", telefone: "(41) 3030-4040", email: "pedidos@suryadental.com.br", endereco: "Rua XV de Novembro, 200 - PR" },
    { nome: "Angelus", cnpj: "76.543.210/0001-55", telefone: "(43) 3371-1000", email: "vendas@angelus.ind.br", endereco: "Londrina - PR" },
    { nome: "FGM Produtos", cnpj: "84.312.567/0001-77", telefone: "(47) 3441-6100", email: "comercial@fgm.ind.br", endereco: "Joinville - SC" },
    { nome: "3M do Brasil", cnpj: "45.985.371/0001-08", telefone: "(11) 3024-6300", email: "dental@3m.com", endereco: "Sumaré - SP" },
  ]).select();
  console.log(fe ? "❌ " + fe.message : "✅ " + forns.length + " fornecedores");

  // === PRODUTOS ===
  console.log("\n--- PRODUTOS ---");
  const f = forns || [];
  const l = locais || [];
  const { data: prods, error: pe } = await sb.from("produtos").insert([
    { nome: "Resina Composta Z350 XT", descricao: "Resina nanoparticulada para restaurações estéticas", codigo_barras: "7891234560001", fornecedor_id: f[5]?.id, local_id: l[0]?.id, categoria: "Restauração", unidade_medida: "UN", quantidade_atual: 25, quantidade_minima: 10, preco_unitario: 89.90, lote: "L2025A", data_validade: "2027-06-15" },
    { nome: "Anestésico Articaína 4%", descricao: "Tubete anestésico com vasoconstritor", codigo_barras: "7891234560002", fornecedor_id: f[0]?.id, local_id: l[3]?.id, categoria: "Anestesia", unidade_medida: "CX", quantidade_atual: 8, quantidade_minima: 15, preco_unitario: 145.00, lote: "AN2025B", data_validade: "2026-12-01" },
    { nome: "Luva Procedimento P", descricao: "Luva de látex descartável P, cx 100un", codigo_barras: "7891234560003", fornecedor_id: f[1]?.id, local_id: l[2]?.id, categoria: "EPI", unidade_medida: "CX", quantidade_atual: 45, quantidade_minima: 20, preco_unitario: 32.50, lote: "LP2025", data_validade: "2028-03-20" },
    { nome: "Luva Procedimento M", descricao: "Luva de látex descartável M, cx 100un", codigo_barras: "7891234560004", fornecedor_id: f[1]?.id, local_id: l[2]?.id, categoria: "EPI", unidade_medida: "CX", quantidade_atual: 38, quantidade_minima: 20, preco_unitario: 32.50, lote: "LM2025", data_validade: "2028-03-20" },
    { nome: "Máscara Tripla Camada", descricao: "Máscara descartável cx 50un", codigo_barras: "7891234560005", fornecedor_id: f[1]?.id, local_id: l[2]?.id, categoria: "EPI", unidade_medida: "CX", quantidade_atual: 30, quantidade_minima: 10, preco_unitario: 18.90, lote: "MT2025", data_validade: "2029-01-01" },
    { nome: "Sugador Descartável", descricao: "Sugador plástico pct 40un", codigo_barras: "7891234560006", fornecedor_id: f[0]?.id, local_id: l[3]?.id, categoria: "Descartáveis", unidade_medida: "PCT", quantidade_atual: 60, quantidade_minima: 20, preco_unitario: 12.00, lote: "SD2025", data_validade: "2030-01-01" },
    { nome: "Algodão Rolete", descricao: "Rolete de algodão hidrófilo pct 100un", codigo_barras: "7891234560007", fornecedor_id: f[2]?.id, local_id: l[3]?.id, categoria: "Descartáveis", unidade_medida: "PCT", quantidade_atual: 50, quantidade_minima: 15, preco_unitario: 8.50, lote: "AR2025", data_validade: "2029-06-01" },
    { nome: "Cimento Ionômero de Vidro", descricao: "Cimento restaurador Vitro Fil LC", codigo_barras: "7891234560008", fornecedor_id: f[3]?.id, local_id: l[0]?.id, categoria: "Restauração", unidade_medida: "UN", quantidade_atual: 12, quantidade_minima: 5, preco_unitario: 67.00, lote: "CIV2025", data_validade: "2027-02-28" },
    { nome: "Ácido Fosfórico 37%", descricao: "Condicionador ácido esmalte e dentina", codigo_barras: "7891234560009", fornecedor_id: f[4]?.id, local_id: l[0]?.id, categoria: "Restauração", unidade_medida: "UN", quantidade_atual: 18, quantidade_minima: 8, preco_unitario: 22.00, lote: "AF2025", data_validade: "2027-09-30" },
    { nome: "Adesivo Single Bond", descricao: "Sistema adesivo universal monocomponente", codigo_barras: "7891234560010", fornecedor_id: f[5]?.id, local_id: l[0]?.id, categoria: "Restauração", unidade_medida: "UN", quantidade_atual: 10, quantidade_minima: 5, preco_unitario: 135.00, lote: "SB2025", data_validade: "2027-04-15" },
    { nome: "Broca Carbide FG 1/4", descricao: "Broca alta rotação ponta redonda", codigo_barras: "7891234560011", fornecedor_id: f[0]?.id, local_id: l[0]?.id, categoria: "Instrumental", unidade_medida: "UN", quantidade_atual: 30, quantidade_minima: 10, preco_unitario: 8.90, lote: "BC2025" },
    { nome: "Broca Diamantada 1012", descricao: "Broca diamantada cônica topo arredondado", codigo_barras: "7891234560012", fornecedor_id: f[0]?.id, local_id: l[0]?.id, categoria: "Instrumental", unidade_medida: "UN", quantidade_atual: 25, quantidade_minima: 10, preco_unitario: 6.50, lote: "BD2025" },
    { nome: "Hipoclorito de Sódio 2.5%", descricao: "Solução irrigadora endodontia", codigo_barras: "7891234560013", fornecedor_id: f[2]?.id, local_id: l[1]?.id, categoria: "Endodontia", unidade_medida: "UN", quantidade_atual: 15, quantidade_minima: 5, preco_unitario: 19.90, lote: "HS2025", data_validade: "2026-08-15" },
    { nome: "Lima Endodôntica K-File #25", descricao: "Lima manual aço inox 25mm blister 6un", codigo_barras: "7891234560014", fornecedor_id: f[3]?.id, local_id: l[1]?.id, categoria: "Endodontia", unidade_medida: "UN", quantidade_atual: 20, quantidade_minima: 8, preco_unitario: 42.00, lote: "LK2025" },
    { nome: "Guta-Percha #25", descricao: "Cones guta-percha principal cx 120 pontas", codigo_barras: "7891234560015", fornecedor_id: f[3]?.id, local_id: l[1]?.id, categoria: "Endodontia", unidade_medida: "CX", quantidade_atual: 6, quantidade_minima: 3, preco_unitario: 38.00, lote: "GP2025", data_validade: "2028-12-31" },
    { nome: "Fio de Sutura Seda 3-0", descricao: "Fio sutura não absorvível com agulha", codigo_barras: "7891234560016", fornecedor_id: f[2]?.id, local_id: l[3]?.id, categoria: "Cirurgia", unidade_medida: "UN", quantidade_atual: 3, quantidade_minima: 10, preco_unitario: 15.00, lote: "FS2025", data_validade: "2027-11-01" },
    { nome: "Alginato Tipo II", descricao: "Material moldagem irreversível pó 454g", codigo_barras: "7891234560017", fornecedor_id: f[0]?.id, local_id: l[1]?.id, categoria: "Prótese", unidade_medida: "UN", quantidade_atual: 7, quantidade_minima: 3, preco_unitario: 45.00, lote: "AL2025", data_validade: "2026-07-01" },
    { nome: "Flúor Gel Acidulado", descricao: "Flúor tópico aplicação profissional 200ml", codigo_barras: "7891234560018", fornecedor_id: f[4]?.id, local_id: l[0]?.id, categoria: "Prevenção", unidade_medida: "UN", quantidade_atual: 0, quantidade_minima: 5, preco_unitario: 28.00, lote: "FG2025", data_validade: "2026-04-10" },
    { nome: "Pasta Profilática", descricao: "Pasta profilaxia com flúor pote 90g", codigo_barras: "7891234560019", fornecedor_id: f[4]?.id, local_id: l[0]?.id, categoria: "Prevenção", unidade_medida: "UN", quantidade_atual: 14, quantidade_minima: 5, preco_unitario: 22.50, lote: "PP2025", data_validade: "2027-08-20" },
    { nome: "Clareador Whiteness HP 35%", descricao: "Peróxido de hidrogênio 35% clareamento", codigo_barras: "7891234560020", fornecedor_id: f[4]?.id, local_id: l[0]?.id, categoria: "Estética", unidade_medida: "KIT", quantidade_atual: 5, quantidade_minima: 3, preco_unitario: 195.00, lote: "WH2025", data_validade: "2027-01-15" },
  ]).select();
  console.log(pe ? "❌ " + pe.message : "✅ " + prods.length + " produtos");

  // === MOVIMENTAÇÕES ===
  console.log("\n--- MOVIMENTAÇÕES ---");
  const p = prods || [];
  const motivos = ["Restauração", "Endodontia", "Profilaxia", "Cirurgia", "Clareamento", "Prótese", "Consulta"];
  const movs = [];

  for (let i = 0; i < 30; i++) {
    const prod = p[Math.floor(Math.random() * p.length)];
    if (!prod) continue;
    const isEntrada = Math.random() > 0.65;
    const qty = Math.floor(Math.random() * 8) + 1;

    if (isEntrada) {
      await sb.from("produtos").update({ quantidade_atual: prod.quantidade_atual + qty }).eq("id", prod.id);
      movs.push({ produto_id: prod.id, usuario_id: uid, tipo: "ENTRADA", quantidade: qty, motivo: "Compra", observacao: "Reposição de estoque" });
      prod.quantidade_atual += qty;
    } else if (prod.quantidade_atual >= qty) {
      await sb.from("produtos").update({ quantidade_atual: prod.quantidade_atual - qty }).eq("id", prod.id);
      movs.push({ produto_id: prod.id, usuario_id: uid, tipo: "SAIDA", quantidade: qty, motivo: motivos[Math.floor(Math.random() * motivos.length)], observacao: "Procedimento clínico" });
      prod.quantidade_atual -= qty;
    }
  }

  const { data: movsData, error: me } = await sb.from("movimentacoes").insert(movs).select();
  console.log(me ? "❌ " + me.message : "✅ " + movsData.length + " movimentações");

  // === NOTIFICAÇÕES (vencimentos) ===
  console.log("\n--- NOTIFICAÇÕES ---");
  const { error: ne } = await sb.rpc("verificar_vencimentos");
  console.log(ne ? "❌ " + ne.message : "✅ Vencimentos verificados");

  // === RESUMO FINAL ===
  console.log("\n=== RESUMO ===");
  for (const t of ["locais", "fornecedores", "produtos", "movimentacoes", "notificacoes", "logs"]) {
    const { count } = await sb.from(t).select("*", { count: "exact", head: true });
    console.log("  " + t + ": " + (count || 0));
  }

  await sb.auth.signOut();
  console.log("\n✅ SEED COMPLETO");
}
run();
