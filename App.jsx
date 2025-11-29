import React, { useState, useMemo, useEffect } from 'react';
import { Search, TrendingUp, Calendar, DollarSign, Filter, ArrowUpDown, Plus, X, Loader } from 'lucide-react';

const DividendManager = () => {
  const [myAssets, setMyAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTicker, setSearchTicker] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shares, setShares] = useState('');

  // Buscar informações de um ticker na API
  const searchTickerInfo = async (ticker) => {
    if (!ticker || ticker.length < 4) return;
    
    setLoading(true);
    try {
      // API gratuita da Brasil API para cotações
      const response = await fetch(`https://brapi.dev/api/quote/${ticker}?token=demo`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const stock = data.results[0];
        setSearchResults([{
          ticker: stock.symbol,
          name: stock.longName || stock.shortName,
          type: stock.symbol.includes('11') || stock.symbol.includes('FII') ? 'FII' : 'Ação',
          sector: stock.sector || 'Não informado',
          currentPrice: stock.regularMarketPrice || 0
        }]);
      } else {
        setSearchResults([]);
        alert('Ticker não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar ticker:', error);
      alert('Erro ao buscar ticker. Tente novamente.');
    }
    setLoading(false);
  };

  // Adicionar ativo à carteira
  const addAssetToPortfolio = (asset) => {
    if (!shares || shares <= 0) {
      alert('Informe a quantidade de cotas/ações');
      return;
    }

    // Simular dados de dividendos (em produção, viria de API específica)
    const newAsset = {
      id: Date.now(),
      ticker: asset.ticker,
      name: asset.name,
      type: asset.type,
      sector: asset.sector,
      value: (asset.currentPrice * 0.006).toFixed(2), // Simulando ~0.6% de dividendo mensal
      yield: (0.6).toFixed(2),
      paymentDate: getNextPaymentDate(),
      shares: parseInt(shares),
      currentPrice: asset.currentPrice
    };

    setMyAssets([...myAssets, newAsset]);
    setShowAddModal(false);
    setSearchTicker('');
    setSearchResults([]);
    setShares('');
  };

  // Calcular próxima data de pagamento (15 do próximo mês)
  const getNextPaymentDate = () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 15);
    return nextMonth.toISOString().split('T')[0];
  };

  // Remover ativo da carteira
  const removeAsset = (id) => {
    if (confirm('Deseja realmente remover este ativo?')) {
      setMyAssets(myAssets.filter(asset => asset.id !== id));
    }
  };

  // Calcular dias até pagamento
  const getDaysUntilPayment = (date) => {
    const today = new Date();
    const payment = new Date(date);
    const diffTime = payment - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Formatar status de pagamento
  const getPaymentStatus = (days) => {
    if (days < 0) return { text: 'Pago', color: 'text-gray-400', bg: 'bg-gray-800' };
    if (days === 0) return { text: 'Hoje', color: 'text-green-400', bg: 'bg-green-900' };
    if (days <= 7) return { text: `${days}d`, color: 'text-yellow-400', bg: 'bg-yellow-900' };
    return { text: `${days}d`, color: 'text-blue-400', bg: 'bg-blue-900' };
  };

  // Filtrar e ordenar dados
  const filteredAndSorted = useMemo(() => {
    let filtered = myAssets.filter(div => {
      const matchesSearch = 
        div.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        div.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || div.type === filterType;
      
      return matchesSearch && matchesType;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch(sortBy) {
        case 'date':
          comparison = new Date(a.paymentDate) - new Date(b.paymentDate);
          break;
        case 'yield':
          comparison = a.yield - b.yield;
          break;
        case 'value':
          comparison = (a.value * a.shares) - (b.value * b.shares);
          break;
        case 'ticker':
          comparison = a.ticker.localeCompare(b.ticker);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [myAssets, searchTerm, filterType, sortBy, sortOrder]);

  // Calcular métricas do dashboard
  const metrics = useMemo(() => {
    const upcoming = myAssets.filter(d => getDaysUntilPayment(d.paymentDate) >= 0);
    const totalToReceive = upcoming.reduce((sum, d) => sum + (d.value * d.shares), 0);
    const avgYield = upcoming.length > 0 
      ? upcoming.reduce((sum, d) => sum + parseFloat(d.yield), 0) / upcoming.length 
      : 0;
    
    return {
      totalToReceive,
      avgYield,
      upcomingCount: upcoming.length
    };
  }, [myAssets]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <TrendingUp className="w-10 h-10" />
                Gestão de Dividendos
              </h1>
              <p className="text-blue-200">Acompanhe seus proventos de forma profissional</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Adicionar Ativo
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="max-w-7xl mx-auto px-8 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-900 to-green-800 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-200">Total a Receber</span>
              <DollarSign className="w-6 h-6 text-green-300" />
            </div>
            <div className="text-3xl font-bold text-white">
              R$ {metrics.totalToReceive.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-green-200 mt-1">Próximos pagamentos</div>
          </div>

          <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-200">Yield Médio</span>
              <TrendingUp className="w-6 h-6 text-blue-300" />
            </div>
            <div className="text-3xl font-bold text-white">
              {metrics.avgYield.toFixed(2)}%
            </div>
            <div className="text-sm text-blue-200 mt-1">Rentabilidade da carteira</div>
          </div>

          <div className="bg-gradient-to-br from-purple-900 to-purple-800 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-200">Pagamentos</span>
              <Calendar className="w-6 h-6 text-purple-300" />
            </div>
            <div className="text-3xl font-bold text-white">
              {metrics.upcomingCount}
            </div>
            <div className="text-sm text-purple-200 mt-1">Ativos com proventos</div>
          </div>
        </div>

        {myAssets.length > 0 && (
          <>
            {/* Filtros */}
            <div className="bg-gray-900 rounded-xl p-6 mb-6 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por ticker ou nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white appearance-none cursor-pointer"
                  >
                    <option value="all">Todos os tipos</option>
                    <option value="Ação">Ações</option>
                    <option value="FII">FIIs</option>
                  </select>
                </div>

                <div className="relative">
                  <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white appearance-none cursor-pointer"
                  >
                    <option value="date">Ordenar por Data</option>
                    <option value="ticker">Ordenar por Ticker</option>
                    <option value="yield">Ordenar por Yield</option>
                    <option value="value">Ordenar por Valor</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tabela */}
            <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-800 border-b border-gray-700">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Ticker</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Nome</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Tipo</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Qtd</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Dividendo</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Total</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Pagamento</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Status</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSorted.map((div, index) => {
                      const days = getDaysUntilPayment(div.paymentDate);
                      const status = getPaymentStatus(days);
                      const total = div.value * div.shares;

                      return (
                        <tr 
                          key={div.id} 
                          className={`border-b border-gray-800 hover:bg-gray-800 transition-colors`}
                        >
                          <td className="px-6 py-4">
                            <span className="font-bold text-blue-400">{div.ticker}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-300">{div.name}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              div.type === 'FII' 
                                ? 'bg-purple-900 text-purple-300' 
                                : 'bg-blue-900 text-blue-300'
                            }`}>
                              {div.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-gray-300">{div.shares}</td>
                          <td className="px-6 py-4 text-right font-semibold text-green-400">
                            R$ {parseFloat(div.value).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-green-300">
                            R$ {total.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-gray-300">
                            {new Date(div.paymentDate).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                              {status.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => removeAsset(div.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {myAssets.length === 0 && (
          <div className="bg-gray-900 rounded-xl p-12 text-center mb-8">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold mb-2 text-gray-400">Nenhum ativo adicionado</h3>
            <p className="text-gray-500 mb-6">Comece adicionando seus primeiros ativos para acompanhar os dividendos</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Adicionar Primeiro Ativo
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pb-8 text-gray-500 text-sm">
          <p>💡 Usando API gratuita da brapi.dev para cotações em tempo real</p>
        </div>
      </div>

      {/* Modal Adicionar Ativo */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Adicionar Ativo</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchTicker('');
                  setSearchResults([]);
                  setShares('');
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Buscar Ticker */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  Buscar Ticker
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: PETR4, VALE3, MXRF11..."
                    value={searchTicker}
                    onChange={(e) => setSearchTicker(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && searchTickerInfo(searchTicker)}
                    className="flex-1 px-4 py-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                  <button
                    onClick={() => searchTickerInfo(searchTicker)}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    Buscar
                  </button>
                </div>
              </div>

              {/* Resultados da Busca */}
              {searchResults.length > 0 && (
                <div className="space-y-4">
                  {searchResults.map((result, index) => (
                    <div key={index} className="bg-gray-800 p-6 rounded-lg">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-blue-400">{result.ticker}</h3>
                          <p className="text-gray-300">{result.name}</p>
                          <p className="text-sm text-gray-500 mt-1">{result.sector}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          result.type === 'FII' 
                            ? 'bg-purple-900 text-purple-300' 
                            : 'bg-blue-900 text-blue-300'
                        }`}>
                          {result.type}
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-400 mb-1">Cotação atual</p>
                        <p className="text-2xl font-bold text-green-400">
                          R$ {result.currentPrice.toFixed(2)}
                        </p>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-semibold mb-2 text-gray-300">
                          Quantidade de cotas/ações
                        </label>
                        <input
                          type="number"
                          placeholder="Ex: 100"
                          value={shares}
                          onChange={(e) => setShares(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        />
                      </div>

                      <button
                        onClick={() => addAssetToPortfolio(result)}
                        className="w-full bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                        Adicionar à Carteira
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DividendManager;
