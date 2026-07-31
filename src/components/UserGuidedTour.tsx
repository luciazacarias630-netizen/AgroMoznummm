import React, { useState, useEffect } from "react";
import { useAgro } from "../context/AgroContext";
import {
  Compass,
  ShoppingBag,
  Sprout,
  Truck,
  Wallet,
  MapPin,
  MessageSquare,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  TrendingUp,
  Smartphone,
} from "lucide-react";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
  tip: string;
  targetTab?: "MARKET" | "FARMER" | "DRIVER" | "MAP" | "ADMIN";
}

interface UserGuidedTourProps {
  activeTab?: string;
  setActiveTab?: (tab: "MARKET" | "FARMER" | "DRIVER" | "MAP" | "ADMIN") => void;
  isOpenManual?: boolean;
  onCloseManual?: () => void;
}

export const UserGuidedTour: React.FC<UserGuidedTourProps> = ({
  setActiveTab,
  isOpenManual,
  onCloseManual,
}) => {
  const { currentUser } = useAgro();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!currentUser) return null;

  // Define steps according to user role
  const getStepsForRole = (): TourStep[] => {
    switch (currentUser.role) {
      case "FARMER":
        return [
          {
            title: "Bem-vindo ao Painel do Agricultor! 🌾",
            description: "Aqui pode gerir toda a sua produção agrícola, listar colheitas e aceitar pedidos de compradores de todo Moçambique.",
            icon: <Sprout className="w-8 h-8 text-emerald-600" />,
            badge: "Passo 1: Gestão de Produtos",
            tip: "Dica: Mantenha os seus preços por kg atualizados para atrativar compradores locais.",
            targetTab: "FARMER",
          },
          {
            title: "Mapeie a sua Machamba 📍",
            description: "Adicione a sua machamba no mapa interativo com localização GPS, província, distrito e cultura produzida.",
            icon: <MapPin className="w-8 h-8 text-amber-600" />,
            badge: "Passo 2: Mapeamento GPS",
            tip: "O mapeamento ajuda os transportadores a calcular as rotas exatas de recolha.",
            targetTab: "MAP",
          },
          {
            title: "Relatórios de Vendas & Faturação 📈",
            description: "Acompanhe as suas receitas recebidas via M-Pesa, E-Mola e Conta Móvel. Baixe relatórios em formato impresso ou PDF.",
            icon: <TrendingUp className="w-8 h-8 text-emerald-700" />,
            badge: "Passo 3: Finanças & Receita",
            tip: "O dinheiro das suas vendas vai diretamente para a sua Carteira AgroMoz.",
            targetTab: "FARMER",
          },
          {
            title: "Chat com Compradores e Transportadores 💬",
            description: "Negocie quantidades, preços especiais de frete e horários de recolha em tempo real através do chat integrado.",
            icon: <MessageSquare className="w-8 h-8 text-blue-600" />,
            badge: "Passo 4: Comunicação Direta",
            tip: "Notificações push vão avisá-lo sempre que um comprador enviar mensagem.",
          },
        ];

      case "DRIVER":
        return [
          {
            title: "Bem-vindo ao Portal do Transportador! 🚚",
            description: "Conecte a sua viatura ou camião às machambas de Moçambique. Veja fretes agrícolas disponíveis na sua região.",
            icon: <Truck className="w-8 h-8 text-amber-600" />,
            badge: "Passo 1: Oportunidades de Frete",
            tip: "Filtre os fretes por província para aceitar corridas perto de si.",
            targetTab: "DRIVER",
          },
          {
            title: "Calculadora de Combustível & Rota ⛽",
            description: "Calcule a distância exata em km entre a machamba do agricultor e o ponto de entrega do comprador com estimativa de consumo.",
            icon: <Compass className="w-8 h-8 text-blue-600" />,
            badge: "Passo 2: Planeamento de Rota",
            tip: "Garanta margens de lucro justas sabendo os custos reais da viagem.",
            targetTab: "DRIVER",
          },
          {
            title: "Pagamentos Garantidos 💳",
            description: "Após concluir a entrega com confirmação do comprador, a taxa do serviço é creditada diretamente na sua Carteira.",
            icon: <Wallet className="w-8 h-8 text-emerald-600" />,
            badge: "Passo 3: Recebimento de Valores",
            tip: "Levante o seu saldo para M-Pesa ou E-Mola a qualquer momento.",
          },
        ];

      case "ADMIN":
        return [
          {
            title: "Painel de Administração AgroMoz ⚙️",
            description: "Controlo centralizado de usuários, aprovação de contas de transportadores, análise de transações e relatórios de impacto nacional.",
            icon: <ShieldCheck className="w-8 h-8 text-slate-900" />,
            badge: "Passo 1: Administração Geral",
            tip: "Verifique documentos de transportadores pendentes de validação.",
            targetTab: "ADMIN",
          },
          {
            title: "Visão Geral do Mapa Agrícola 🇲🇿",
            description: "Visualize a distribuição de machambas e rotas de transporte ativas por todas as 10 províncias de Moçambique.",
            icon: <MapPin className="w-8 h-8 text-amber-600" />,
            badge: "Passo 2: Monitorização do Mapa",
            tip: "Acompanhe a densidade de produção por regiões do país.",
            targetTab: "MAP",
          },
        ];

      case "BUYER":
      default:
        return [
          {
            title: "Bem-vindo ao Mercado Agrícola! 🛒",
            description: "Compre milho, feijão, hortaliças e frutas diretamente dos produtores moçambicanos sem intermediários abusivos.",
            icon: <ShoppingBag className="w-8 h-8 text-emerald-600" />,
            badge: "Passo 1: Produtos Diretos da Machamba",
            tip: "Compre produtos mais frescos por preços mais acessíveis.",
            targetTab: "MARKET",
          },
          {
            title: "Filtro por Província 🇲🇿",
            description: "Selecione a sua província (ex: Maputo, Sofala, Nampula) para encontrar colheitas disponíveis perto da sua zona.",
            icon: <MapPin className="w-8 h-8 text-amber-600" />,
            badge: "Passo 2: Filtro Regional",
            tip: "Produtos locais têm custos de transporte reduzidos e chegam mais rápido.",
            targetTab: "MARKET",
          },
          {
            title: "Pagamento com M-Pesa / E-Mola 📱",
            description: "Pague com segurança utilizando carteiras móveis nacionais. O valor fica seguro até a confirmação do pedido.",
            icon: <Smartphone className="w-8 h-8 text-emerald-700" />,
            badge: "Passo 3: Pagamento Facilitado",
            tip: "Suporta M-Pesa, E-Mola e Conta Móvel Millenium BIM.",
          },
          {
            title: "Rastreio em Tempo Real 📦",
            description: "Acompanhe o estado da sua encomenda em tempo real, desde o carregamento na machamba até à entrega na sua porta.",
            icon: <Truck className="w-8 h-8 text-blue-600" />,
            badge: "Passo 4: Rastreamento do Frete",
            tip: "Receberá notificações no telemóvel quando o transportador estiver a caminho.",
          },
        ];
    }
  };

  const steps = getStepsForRole();

  // Auto show on first login or when manually opened
  useEffect(() => {
    if (isOpenManual) {
      setIsOpen(true);
      setCurrentStepIndex(0);
      return;
    }

    const tourKey = `agromoz_tour_done_${currentUser.id}`;
    const done = localStorage.getItem(tourKey);
    if (!done) {
      // Delay 1 second to let UI render properly
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentUser.id, isOpenManual]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      if (steps[nextIdx].targetTab && setActiveTab) {
        setActiveTab(steps[nextIdx].targetTab!);
      }
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      if (steps[prevIdx].targetTab && setActiveTab) {
        setActiveTab(steps[prevIdx].targetTab!);
      }
    }
  };

  const handleFinish = () => {
    localStorage.setItem(`agromoz_tour_done_${currentUser.id}`, "true");
    setIsOpen(false);
    if (onCloseManual) onCloseManual();
  };

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 max-w-lg w-full overflow-hidden relative transition-all duration-300">
        {/* Header Decor */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-amber-700 p-6 text-white relative">
          <button
            onClick={handleFinish}
            className="absolute top-4 right-4 p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all"
            title="Fechar Guia"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Guia de Utilização
            </span>
            <span className="text-emerald-100 text-xs font-semibold">
              {currentUser.role === "FARMER"
                ? "🌾 Perfil Agricultor"
                : currentUser.role === "DRIVER"
                ? "🚚 Perfil Transportador"
                : currentUser.role === "ADMIN"
                ? "⚙️ Perfil Administrador"
                : "🛒 Perfil Comprador"}
            </span>
          </div>

          <h3 className="text-xl font-extrabold flex items-center gap-2">
            {currentStep.title}
          </h3>

          {/* Progress bar dots */}
          <div className="flex items-center gap-1.5 mt-4">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStepIndex
                    ? "w-8 bg-amber-400"
                    : idx < currentStepIndex
                    ? "w-3 bg-emerald-300"
                    : "w-3 bg-emerald-900/40"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 shrink-0">
              {currentStep.icon}
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                {currentStep.badge}
              </span>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {currentStep.description}
              </p>
            </div>
          </div>

          {/* Useful Tip Box */}
          <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-start gap-2 text-xs text-amber-950 font-semibold">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{currentStep.tip}</span>
          </div>

          {/* Navigation Controls */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                currentStepIndex === 0
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>

            <span className="text-xs font-bold text-slate-400">
              {currentStepIndex + 1} / {steps.length}
            </span>

            <button
              onClick={handleNext}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <span>{currentStepIndex === steps.length - 1 ? "Concluir Guia" : "Próximo"}</span>
              {currentStepIndex === steps.length - 1 ? (
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
