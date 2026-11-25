// ===== CONFIGURE AQUI =====
var CFG={
 preco:19.9, precoDe:49.9, descontoPix:0.05,
 pixKey:"seu-email-ou-chave@exemplo.com", // sua chave Pix
 nome:"SEU NOME", cidade:"VITORIA",       // sem acentos
 modoTeste:true,                          // true: "Já paguei" libera o guia na hora. false: abre o WhatsApp
 whats:"5527999999999"
};
var IDEAS=[
 ["Revenda de produtos","R$ 300 a 1.500/mês","Compre em atacado e revenda por catálogo ou redes sociais. Primeiro passo: escolha um nicho e peça 3 orçamentos."],
 ["Serviço de organização de planilhas","R$ 200 a 1.200/mês","Pequenos negócios pagam por controles de caixa e estoque. Primeiro passo: monte um modelo e ofereça a 3 conhecidos."],
 ["Venda de marmitas por encomenda","R$ 400 a 2.000/mês","Atenda vizinhos e empresas próximas com cardápio fixo. Primeiro passo: teste 10 marmitas e peça feedback."],
 ["Edição de vídeos curtos","R$ 300 a 1.800/mês","Criadores e lojas precisam de cortes para redes sociais. Primeiro passo: edite 3 vídeos de exemplo."],
 ["Aulas particulares online","R$ 250 a 1.500/mês","Ensine o que você domina, de idiomas a reforço escolar. Primeiro passo: defina o público e o preço por hora."],
 ["Gestão de redes sociais","R$ 400 a 2.500/mês","Comércios locais pagam para ter perfis ativos. Primeiro passo: faça o perfil de um negócio da sua rua."],
 ["Pequenos reparos e montagem","R$ 300 a 1.600/mês","Montar móveis e instalar prateleiras tem muita procura. Primeiro passo: divulgue no seu bairro."],
 ["Artesanato personalizado","R$ 200 a 1.400/mês","Presentes com nome e datas comemorativas vendem bem. Primeiro passo: crie um produto e divulgue em grupos."]
];
var $=function(i){return document.getElementById(i)};
var brl=function(v){return v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})};
var pixv=Math.round(CFG.preco*(1-CFG.descontoPix)*100)/100,paid=false,lead={},last=null;
function fill(a,t){[].forEach.call(document.querySelectorAll(a),function(e){e.textContent=t})}
fill("[data-price]",brl(CFG.preco));fill("[data-de]",brl(CFG.precoDe));fill("[data-pix]",brl(pixv));fill("[data-off]",Math.round(CFG.descontoPix*100)+"%");
if(CFG.modoTeste)$("tb").hidden=false;

function list(){
 $("list").innerHTML=IDEAS.map(function(x,i){
  var open=i<2||paid,c='<div class="'+(open?"":"blur")+'"><h3><span class="n">'+(i+1)+'.</span>'+x[0]+'</h3><p><b>Ganho estimado: '+x[1]+'</b></p><p class="muted" style="margin:0">'+x[2]+'</p></div>';
  return '<div class="item'+(open?(paid&&i>1?" unlocked":""):" locked")+'">'+c+'</div>';
 }).join("");
}
list();

function tlv(id,v){return id+("0"+v.length).slice(-2)+v}
function crc16(s){var c=0xFFFF;for(var i=0;i<s.length;i++){c^=s.charCodeAt(i)<<8;for(var j=0;j<8;j++)c=(c&0x8000)?((c<<1)^0x1021):(c<<1);c&=0xFFFF}return("000"+c.toString(16).toUpperCase()).slice(-4)}
function brcode(v,txid){var f=tlv("00","01")+tlv("01","12")+tlv("26",tlv("00","br.gov.bcb.pix")+tlv("01",CFG.pixKey))+tlv("52","0000")+tlv("53","986")+tlv("54",v.toFixed(2))+tlv("58","BR")+tlv("59",CFG.nome.slice(0,25))+tlv("60",CFG.cidade.slice(0,15))+tlv("62",tlv("05",txid))+"6304";return f+crc16(f)}

function show(h){$("md").innerHTML=h;$("ov").classList.add("on");last=document.activeElement}
function hide(){$("ov").classList.remove("on");if(last&&last.focus)last.focus()}
function head(t){return '<div class="mh"><h3>'+t+'</h3><button class="x" data-a="x" aria-label="Fechar">×</button></div>'}
function form(){
 show(head("Seus dados")+'<label for="nm">Nome</label><input id="nm" autocomplete="name"><label for="em">E-mail</label><input id="em" type="email" autocomplete="email"><div class="err" id="er"></div><button class="btn" data-a="gen">Gerar Pix de '+brl(pixv)+'</button>');
 $("nm").focus();
}
function pix(){
 var id="GUIA"+Date.now().toString(36).toUpperCase().slice(-10);lead.id=id;
 var code=brcode(pixv,id);window._c=code;
 show(head("Pague com Pix")+'<div style="text-align:center;font-weight:800;font-size:1.6rem">'+brl(pixv)+'</div><div class="qr" id="qr"></div><div class="code" id="cd">'+code+'</div><button class="btn" data-a="copy">Copiar código Pix</button><button class="btn ghost" data-a="paid">Já paguei</button>');
 new QRCode($("qr"),{text:code,width:196,height:196,correctLevel:QRCode.CorrectLevel.M});
}
function paidFlow(){
 if(CFG.modoTeste){paid=true;list();hide();location.hash="#list";return}
 var msg=encodeURIComponent("Olá! Paguei o guia via Pix.\nNome: "+lead.n+"\nE-mail: "+lead.e+"\nPedido: "+lead.id);
 show(head("Falta um passo")+'<p>Envie o comprovante pelo WhatsApp para receber o guia em <b>'+lead.e+'</b>.</p><a class="btn" target="_blank" rel="noopener" href="https://wa.me/'+CFG.whats+'?text='+msg+'">Enviar comprovante</a>');
}
document.addEventListener("click",function(e){
 if(e.target.id==="ov"){hide();return}
 var b=e.target.closest("button");if(!b)return;
 if(b.id==="buy"){form();return}
 var a=b.dataset.a;
 if(a==="x")hide();
 else if(a==="gen"){var n=$("nm").value.trim(),m=$("em").value.trim();
  if(n.length<3||!/^\S+@\S+\.\S+$/.test(m)){$("er").textContent="Preencha seu nome e um e-mail válido.";return}
  lead={n:n,e:m};pix()}
 else if(a==="copy"){var s=function(){b.textContent="Código copiado!"};
  try{navigator.clipboard.writeText(window._c).then(s,f)}catch(x){f()}
  function f(){var r=document.createRange();r.selectNodeContents($("cd"));var g=getSelection();g.removeAllRanges();g.addRange(r);b.textContent="Selecionado: copie o código"}}
 else if(a==="paid")paidFlow();
});
document.addEventListener("keydown",function(e){if(e.key==="Escape")hide()});