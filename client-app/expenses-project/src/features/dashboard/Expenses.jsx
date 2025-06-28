import React, { useState, useEffect } from "react";
import axios from 'axios';
import { PieChart as RechartsPieChart, Cell, Pie, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { parseJwt } from "../../utils/jwt";
import { X, ChevronLeft, ChevronRight, DollarSign, TrendingUp, List, Clock, AlertCircle, CheckCircle } from 'lucide-react';


const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Paleta de colores más contrastante y distintiva
const IMPROVED_PALETTE = [
  '#FF6B6B', // Rojo coral
  '#4ECDC4', // Turquesa
  '#45B7D1', // Azul cielo
  '#96CEB4', // Verde menta
  '#FFEAA7', // Amarillo suave
  '#DDA0DD', // Violeta suave
  '#FFB347', // Naranja durazno
  '#98D8C8', // Verde agua
  '#F7DC6F', // Amarillo dorado
  '#BB8FCE', // Púrpura suave
  '#85C1E9', // Azul claro
  '#F8C471', // Naranja claro
  '#82E0AA', // Verde claro
  '#F1948A', // Rosa salmón
  '#AED6F1', // Azul pastel
  '#D7BDE2', // Lavanda
  '#A9DFBF', // Verde pastel
  '#F9E79F', // Amarillo pastel
  '#FAD7A0', // Beige
  '#D5A6BD'  // Rosa grisáceo
];

// Lista de meses en español
const meses = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];


// Función para obtener colores únicos y secuenciales
function getDistinctColor(index) {
  return IMPROVED_PALETTE[index % IMPROVED_PALETTE.length];
}

export default function ExpensesDashboard() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [chartView, setChartView] = useState('pie');
  // para el modal
  const [showModal, setShowModal]       = useState(false);
  const [monthOffset, setMonthOffset]   = useState(0);

  const [cuotasPendientes, setCuotasPendientes] = useState([]);
  const [resumenCuotas, setResumenCuotas] = useState(null);




  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const payload = parseJwt(token);
    if (!payload) return;

    const userId = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
    setUserId(userId);

    fetchCategories(token);
    fetchExpenses(token, userId);
    fetchCuotasPendientes(token, userId, monthOffset);
}, [monthOffset, userId]);

const fetchCuotasPendientes = async (token, userId, offset = 0) => {
  const base = new Date();
  base.setDate(1);
  base.setHours(0, 0, 0, 0);
  const targetDate = new Date(base.getFullYear(), base.getMonth() + offset, 1);

  const anio = targetDate.getFullYear();
  const mes = targetDate.getMonth() + 1; // 0-based

  try {
    const response = await fetch(`${BASE_URL}/api/Expenses/cuotas/${userId}/${anio}/${mes}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    const cuotas = data
    .filter(cuota => cuota.estado !== "pagada")
    .map((cuota) => ({
      id: cuota.id,
      descripcionGasto: cuota.expense?.description || 'Sin descripción',
      categoria: cuota.expense?.category?.nombre || 'Sin categoría',
      nroCuota: cuota.nroCuota,
      fechaPago: cuota.fechaPago,
      montoCuota: cuota.montoCuota,
      pagadas: cuota.pagadas ?? null,
      restantes: cuota.restantes ?? null,
      totalCuotas: cuota.totalCuotas ?? null,
    }));

    const montoPendiente = cuotas.reduce((sum, c) => sum + c.montoCuota, 0);
    setCuotasPendientes(cuotas);
  } catch (err) {
    console.error('Error al obtener cuotas pendientes:', err);
  }
};

useEffect(() => {
  if (!cuotasPendientes) return;

  const total = cuotasPendientes.length;
  const monto = cuotasPendientes.reduce((sum, c) => sum + c.montoCuota, 0);

  setResumenCuotas({
    cuotasPendientes: total,
    montoPendiente: monto,
  });
}, [cuotasPendientes]);


  const fetchCategories = async (token) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${BASE_URL}/api/Categories`, config);
      setCategories(response.data);
    } catch (error) {
      console.error("Error al obtener categorías:", error);
    }
  };

  const fetchExpenses = async (token, userId) => {
  setLoading(true);
  try {
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const [resDirectos, cuotasPagadas] = await Promise.all([
      axios.get(`${BASE_URL}/api/Expenses`, config),
      fetchCuotasPagadasDelMes(token, userId, monthOffset)
    ]);

    const directos = resDirectos.data
  .filter(e => e.tieneCuotas === false) // ⚠️ SOLO los gastos sin cuotas
  .map(e => ({
    id: e.id,
    description: e.description,
    amount: e.amount,
    date: e.date,
    categoryId: e.categoryId,
    categoryName: e.categoryName,
    type: "directo"
  }));

    setTransactions([...directos, ...cuotasPagadas]);
  } catch (error) {
    console.error("Error al obtener gastos:", error);
  } finally {
    setLoading(false);
  }
};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };
  
  // últimos 5 movimientos
  const lastFive = [...transactions]
  .sort((a,b) => new Date(b.date) - new Date(a.date))
  .slice(0,5);
  
  // para el modal: filtrar gastos del mes
  const zeroDate = new Date();
  zeroDate.setDate(1);
  zeroDate.setHours(0,0,0,0);
  const baseMonth = new Date(zeroDate.getFullYear(), zeroDate.getMonth(), 1);
  const selMonth = new Date(
    baseMonth.getFullYear(),
    baseMonth.getMonth() + monthOffset,
    1
  );
  
  const nextMonth = new Date(selMonth.getFullYear(), selMonth.getMonth()+1, 1);
  
  const monthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= selMonth && d < nextMonth;
  });

  const categoryColorMap = categories.reduce((acc, cat, index) => {
    acc[cat.id] = getDistinctColor(index);
    return acc;
  }, {});

  // datos para la torta
  const chartData = categories.map((cat) => {
  const sum = monthTransactions
    .filter(t => t.categoryId === cat.id)
    .reduce((a, b) => a + b.amount, 0);
  return {
    name: cat.name,
    value: sum,
    color: categoryColorMap[cat.id],
    categoryId: cat.id // ← Mantener referencia al ID original
  };
}).filter(d => d.value > 0);


  const modalList = [...monthTransactions].sort((a,b) => new Date(b.date) - new Date(a.date));

  const totalExpense = modalList.reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = chartData
  .reduce((a,b) => a + b.value, 0);

  const sortedChartData = [...chartData].sort((a, b) => b.value - a.value);
  


  const obtenerMesAnioDeCuotas = () => {
  if (cuotasPendientes.length === 0) return { mesNombre: '', anio: '' };

  const fecha = new Date(cuotasPendientes[0].fechaPago); // <-- MES REAL de la cuota
  const mesNombre = meses[fecha.getMonth()];
  const anio = fecha.getFullYear();

  return { mesNombre, anio };
};
const { mesNombre, anio } = obtenerMesAnioDeCuotas();

const pagarCuota = async (idCuota) => {
  const token = localStorage.getItem("token");
  if (!token || !userId) return;

  setLoading(true);
  try {
    const config = { headers: { Authorization: `Bearer ${token}` } };

    await axios.put(`${BASE_URL}/api/Expenses/cuotas/${idCuota}/pagar`, null, config);

    await fetchCuotasPendientes(token, userId, monthOffset);

    // ✅ Eliminar la cuota pagada de la lista
    const cuotaPagada = cuotasPendientes.find(c => c.id === idCuota);
    if (!cuotaPagada) return;

    setCuotasPendientes(prev => prev.filter(c => c.id !== idCuota));

    await fetchExpenses(token, userId);
  } catch (error) {
    console.error("Error al pagar cuota:", error);
  } finally {
    setLoading(false);
  }
};


const fetchCuotasPagadasDelMes = async (token, userId, offset = 0) => {
  const base = new Date();
  base.setDate(1);
  base.setHours(0, 0, 0, 0);
  const targetDate = new Date(base.getFullYear(), base.getMonth() + offset, 1);

  const anio = targetDate.getFullYear();
  const mes = targetDate.getMonth() + 1;

  try {
    const response = await fetch(`${BASE_URL}/api/Expenses/cuotas/pagadas/${userId}/${anio}/${mes}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    // Convertir cuotas pagadas a formato "transaction"
    return data.map((cuota) => ({
      id: cuota.id,
      description: cuota.description,
      categoryName: cuota.categoryName,
      categoryId: cuota.categoryId ,
      amount: cuota.montoCuota,
      date: cuota.fechaPago, // ✅ Esta es la fecha real del gasto
      type: "cuota",
    }));
  } catch (err) {
    console.error("Error al obtener cuotas pagadas:", err);
    return [];
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-black p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header con navegación */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2 dark:text-white">Detalle de gastos</h1>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 shadow-lg w-full sm:w-auto"
          >
            Volver al Inicio
          </button>
        </div>

        {/* Layout principal en grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">    

          {/* Bloque 1: Resumen de gastos con Gráfico */}
          {chartView === 'pie' && (
            <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6">
              {/* Header responsive del gráfico */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                    <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                    Gastos por Categoría
                  </h3>
                </div>
                
                {/* Selector de Mes - Responsive */}
                <div className="flex items-center justify-center gap-1 sm:gap-2 bg-gray-100 dark:bg-gray-700 rounded-full px-3 sm:px-6 py-2 sm:py-3 w-full sm:w-auto">
                  <button
                    onClick={() => setMonthOffset(m => m - 1)}
                    className="p-1 sm:p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors flex-shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-white" />
                  </button>
                  <h5 className="text-sm sm:text-lg font-semibold dark:text-white text-center flex-1 min-w-0 px-2">
                    <span className="hidden sm:inline">
                      {selMonth.toLocaleDateString('es-AR', { year:'numeric', month:'long' })}
                    </span>
                    <span className="sm:hidden">
                      {selMonth.toLocaleDateString('es-AR', { year:'2-digit', month:'short' })}
                    </span>
                  </h5>
                  <button
                    onClick={() => setMonthOffset(m => m + 1)}
                    className="p-1 sm:p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors flex-shrink-0"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-white" />
                  </button>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-center">
                {/* Total de gastos */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4 border-l-4 border-red-500">
                    <p className="text-red-700 dark:text-red-400 font-medium mb-2">Total gastos</p>
                    <p className="text-2xl sm:text-3xl font-bold text-red-800 dark:text-red-300">
                      {formatCurrency(totalExpense)}
                    </p>
                  </div>

                  {/* Leyenda del gráfico - Responsive */}
                  <div className="grid grid-cols-1 gap-2 sm:gap-3">
                    {chartData.map((entry, index) => (
                      <div key={index} className="flex items-center justify-start p-2 bg-gray-50 dark:bg-gray-700 rounded-lg space-x-2 dark:text-white">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-sm sm:text-base truncate">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gráfico de Torta - Responsive */}
                <div className="flex justify-center">
                  <div className="w-full" style={{ height: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={window.innerWidth < 640 ? 80 : 120}
                          dataKey="value"
                          stroke="#ffffff"
                          strokeWidth={2}
                        >
                          {chartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${entry.categoryId}`} 
                              fill={entry.color}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}


        {/* NUEVO BLOQUE REDISEÑADO DE CUOTAS */}
          <div className="xl:col-span-2 w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">

            {/* Top: resumen cuotas y monto */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                <h4 className="text-sm text-gray-600 dark:text-gray-300">Cuotas pendientes este mes</h4>
                <p className="text-2xl font-bold text-orange-600">
                  {resumenCuotas ? resumenCuotas.cuotasPendientes : 0}
                </p>
              </div>

              <div className="flex-1 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <h4 className="text-sm text-gray-600 dark:text-gray-300">Monto pendiente total</h4>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(resumenCuotas ? resumenCuotas.montoPendiente : 0)}
                </p>
              </div>
            </div>

            {/* Header */}
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
  Cuotas Pendientes - {selMonth.toLocaleDateString('es-AR', { year:'numeric', month:'long' })}
</h4>
            </div>

            {/* Cuotas + progreso lado a lado */}
            <div className="space-y-4">
              {cuotasPendientes.map((cuota) => {
                const totalCuotas = cuota.totalCuotas || 6;
                const pagadas = cuota.pagadas || (totalCuotas - cuota.restantes);
                const progreso = (pagadas / totalCuotas) * 100;

                return (
                  <div key={cuota.id} className="flex gap-4 items-start grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Información del gasto */}
                    <div className="flex-1 bg-orange-50 rounded-lg p-4 shadow-sm border border-orange-200">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                            <span className="font-medium text-gray-800 dark:text-white">{cuota.descripcionGasto}</span>
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                              {cuota.categoria}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            Cuota {cuota.nroCuota} - Vence: {new Date(cuota.fechaPago).toLocaleDateString('es-AR')}
                          </div>
                          <div className="text-lg font-semibold text-orange-600 mt-1">
                            {formatCurrency(cuota.montoCuota)}
                          </div>
                        </div>
                        <button
                          onClick={() => pagarCuota(cuota.id)}
                          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Pagar</span>
                        </button>
                      </div>
                    </div>

                    {/* Progreso individual */}
                    <div className=" min-w-[140px] min-h-[118px] bg-gray-100 dark:bg-gray-700 p-3 rounded shadow-sm h-fit">
                      <h5 className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Progreso de Pago</h5>
                      <div className="w-full bg-gray-300 rounded-full h-2 mb-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${progreso}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        Pagadas: <strong>{pagadas}</strong> / {totalCuotas}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        Pendientes: <strong>{cuota.restantes || totalCuotas - pagadas}</strong>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mostrar más (si aplica) */}
            {cuotasPendientes.length > 3 && (
              <div className="text-right mt-2">
                <button
                  className="text-sm text-orange-600 hover:underline"
                  onClick={mostrarMasCuotas}
                >
                  Ver todas las cuotas pendientes ({cuotasPendientes.length - 3} más)
                </button>
              </div>
            )}
          </div>


          {/* Bloque 2: Últimos Movimientos */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 w-full max-w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Últimos Movimientos</h4>
            </div>
            
            <div className="space-y-3">
              {lastFive.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="font-medium text-gray-800 dark:text-white truncate">{tx.description}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      {new Date(tx.date).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-red-600 dark:text-red-400 text-sm sm:text-base">
                      -{formatCurrency(tx.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowModal(true)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium hover:underline"
              >
                Ver todos los movimientos
              </button>
            </div>
          </div>

          {/* Bloque 3: gastos Agrupados por Categorías */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg">
                <List className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Gastos por Categoría</h4>
            </div>
            
            <div className="grid grid-cols-1 gap-4 flex-1 overflow-y-auto">
              {sortedChartData.map((c,i) => (
                <div key={i} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl px-4 py-3 border-l-4 border-gray-300 dark:border-gray-500">
                  <div className="flex items-center space-x-3 mb-2">
                    <div
                        className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-white truncate">{c.name}</h3>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">
                    {formatCurrency(c.value)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                    {((c.value / chartData.reduce((acc, item) => acc + item.value, 0)) * 100).toFixed(1)}% del total
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal - Responsive */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col relative">
              <div className="p-4 sm:p-6 pb-0">
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Header del modal - Responsive */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pr-12">
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-2">
                    <button
                      onClick={() => setMonthOffset(m => m - 1)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h5 className="text-sm sm:text-lg font-semibold dark:text-white px-2">
                      <span className="hidden sm:inline">
                        {selMonth.toLocaleDateString('es-AR', { year:'numeric', month:'long' })}
                      </span>
                      <span className="sm:hidden">
                        {selMonth.toLocaleDateString('es-AR', { year:'2-digit', month:'short' })}
                      </span>
                    </h5>
                    <button
                      onClick={() => setMonthOffset(m => m + 1)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => setMonthOffset(0)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Hoy
                  </button>
                </div>
              </div>

              {/* Lista de transacciones - Scrollable */}
              <div className="flex-1 overflow-auto px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="space-y-2">
                  {modalList.length === 0 && (
                    <p className="text-gray-500 dark:text-white text-center py-8">No hay gastos este mes.</p>
                  )}
                  {modalList.map(tx => (
                    <div key={tx.id} className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-600">
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="font-medium dark:text-white truncate">{tx.description}</p>
                        <p className="text-gray-500 dark:text-gray-300 text-sm">
                          {new Date(tx.date).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                      <div className="font-medium text-red-600 flex-shrink-0 text-sm sm:text-base">
                        -{formatCurrency(tx.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}