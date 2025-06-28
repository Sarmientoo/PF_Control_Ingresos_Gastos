import React, { useState, useEffect } from "react";
import axios from 'axios';
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3, PieChart, Grid3X3,ChevronLeft, ChevronRight } from 'lucide-react';
import { PieChart as RechartsPieChart, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Pie } from 'recharts';
import { useNavigate } from 'react-router-dom';
import SuccessModal from './SucessModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import ErrorModal from "./ErrorModal";
import { parseJwt } from '../utils/jwt';
import TimeSeriesChart from './TimeSeriesChart';
import {
  postTransactionOnServer,
  putTransactionOnServer,
  deleteTransactionOnServer,
  buildBody,
  replaceTransaction,
  addTransaction
} from '../utils/transactionService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const COLORS = ['#4ade80', '#f87171', '#60a5fa']; // verde, rojo, azul

const Dashboard = () => {
  const navigate = useNavigate();

  // Estado general
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [enCuotas, setEnCuotas] = useState(false);
const [cantidadCuotas, setCantidadCuotas] = useState('');
const [fechaInicioCuotas, setFechaInicioCuotas] = useState('');


  // Estado de transacciones
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({
    type: 'ingreso',
    category: '',
    amount: '',
    date: '',
    description: '',
    categoryId: ''
    });
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formError, setFormError] = useState('');
  const [chartView, setChartView] = useState('default');

  const [filteredData, setFilteredData] = useState('');

  // Estado de modales
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState({ show: false, target: null, type: null });


  // Panel admin
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminView, setAdminView] = useState('summary');
  const [summaryData, setSummaryData] = useState(null);
  const [summaryUserId, setSummaryUserId] = useState('');
  const [filterParams, setFilterParams] = useState({
    userId: '',
    categoryId: '',
    from: '',
    to: ''
  });

  const [notFoundMessage, setNotFoundMessage] = useState("");

  // Categorías
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState("gasto");
  const [editingCategoryType, setEditingCategoryType] = useState("gasto");
  const [currentType, setCurrentType] = useState('gasto');


  // Calculamos el primer día del mes seleccionado y el siguiente
  const today       = new Date();
  const startOfThis = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const startOfNext = new Date(startOfThis.getFullYear(), startOfThis.getMonth() + 1, 1);

  // Filtramos solo las transacciones de ese mes
  const periodTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= startOfThis && d < startOfNext;
  });

  const totalIncome = periodTransactions
  .filter((t) => t.type === "ingreso")
  .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = periodTransactions
  .filter((t) => t.type === "gasto")
  .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const fetchCategoriesByType = async (type) => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const res = await axios.get(`${BASE_URL}/api/Categories/by-type/${type}`, config);
    setCategories(res.data);
  } catch (error) {
    console.error("Error al cargar categorías por tipo:", error);
  }
};

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token || !newCategoryName) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(
        `${BASE_URL}/api/Categories`,
        { name: newCategoryName, type: newCategoryType },
        config
      );

      setNewCategoryName("");
      fetchCategoriesByType(currentType);
    } catch (err) {
  //console.error("Error al crear categoría:", err);

  let message = "Error al crear categoría";

  // Si el backend devuelve un string plano como error
  if (typeof err.response?.data === "string") {
    message = err.response.data;
  }

  // Si devuelve un objeto con mensaje
  else if (typeof err.response?.data?.message === "string") {
    message = err.response.data.message;
  }

  // Si devuelve un objeto con errores de validación
  else if (err.response?.data?.errors) {
    const errors = err.response.data.errors;
    // Tomamos el primer mensaje del primer campo que tenga errores
    const firstKey = Object.keys(errors)[0];
    if (Array.isArray(errors[firstKey])) {
      message = errors[firstKey][0]; // Mostramos solo el primer mensaje
    }
  }

  setErrorMessage(message);
  setShowError(true);
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
      expenseId: cuota.expenseId,
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


  const handleDeleteCategory = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${BASE_URL}/api/Categories/${id}`, config);
      fetchCategoriesByType(currentType);
    } catch (err) {
    //console.error("Error al eliminar categoría:", err);

    let message = "Error al eliminar categoría";

    if (typeof err.response?.data === "string") {
      message = err.response.data;
    } else if (typeof err.response?.data?.message === "string") {
      message = err.response.data.message;
    } else if (err.response?.data?.errors) {
      const errors = err.response.data.errors;
      const firstKey = Object.keys(errors)[0];
      if (Array.isArray(errors[firstKey])) {
        message = errors[firstKey][0];
      }
    }

    setErrorMessage(message);
    setShowError(true);
  }
  };

  const handleEditCategory = async (category) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const body = {
        id: category.id,
        name: category.name,  // el nuevo nombre
        type: category.type || currentType
      };

       console.log("Editando categoría:", body);

      await axios.put(`${BASE_URL}/api/Categories/${category.id}`, body, config);
      fetchCategoriesByType(body.type);

    } catch (error) {
      //console.error("Error al crear/editar categoría:", error);

      const apiData = error.response?.data;
      let msg = "";

      if (apiData) {
        // 1) Si viene un objeto con 'errors' tal y como en ProblemDetails:
        if (apiData.errors && typeof apiData.errors === "object") {
          // aplanamos todos los arrays de errores y los unimos en una cadena
          const errorMessages = Object.values(apiData.errors).flat();
          msg = errorMessages.join(", ");
        }
        // 2) Si viene un campo 'message' (tu JSON custom anterior)
        else if (apiData.message) {
          msg = apiData.message;
        }
        // 3) Si viene un 'title' (ProblemDetails.title)
        else if (apiData.title) {
          msg = apiData.title;
        }
        // 4) Si viene texto plano
        else if (typeof apiData === "string") {
          msg = apiData;
        }
      }

      // 5) Fallback genérico
      if (!msg) {
        msg = error.message || "Ocurrió un error inesperado";
      }

      setErrorMessage(msg);
      setShowError(true);
    } finally {
      setLoading(false);
    }

  };

  const handleSubmit = async () => {
  if (
    !formData.amount ||
    !formData.categoryId ||
    isNaN(Number(formData.categoryId)) ||
    !formData.description
  ) {
    setFormError("Completa todos los campos obligatorios");
    return;
  }

  // Validación condicional de fecha
  if (formData.type === "gasto" && enCuotas) {
    // Para gastos en cuotas, validar campos específicos
    if (!cantidadCuotas || !fechaInicioCuotas) {
      setFormError("Completá los datos de cuotas");
      return;
    }
    if (parseInt(cantidadCuotas) <= 0) {
      setFormError("La cantidad de cuotas debe ser mayor a cero");
      return;
    }
  } else {
    // Para transacciones normales (ingresos o gastos simples), validar fecha normal
    if (!formData.date) {
      setFormError("Selecciona una fecha");
      return;
    }
  }

  const token = localStorage.getItem("token");

  try {
    if (formData.type === "gasto" && enCuotas) {
      // Crear gasto con cuotas
      const body = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        fechaInicio: fechaInicioCuotas,
        categoryId: parseInt(formData.categoryId),
        cuotas: parseInt(cantidadCuotas),
        userId: userId
      };

      await axios.post(`${BASE_URL}/api/Expenses/with-installments`, body, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Mensaje específico para cuotas
      console.log(`Gasto en ${cantidadCuotas} cuotas creado exitosamente`);
    } else {
      // Transacción normal (ingreso o gasto simple)
      await createTransaction(formData);
    }

    resetForm();
    setFormError("");
    
    // Opcional: Recargar las transacciones para mostrar los cambios
    // await loadTransactions();
    
  } catch (error) {
    console.error(error);
    console.log('Error 500:', error.response?.data || error.message);

    
    // Manejo más específico de errores
    if (error.response?.data?.message) {
      setFormError(error.response.data.message);
    } else if (error.response?.data) {
      setFormError("Error del servidor: " + JSON.stringify(error.response.data));
    } else {
      setFormError("Ocurrió un error al guardar la transacción.");
    }
  }
};


  const createTransaction = async (formData) => {
    const token = localStorage.getItem("token");
    if (!token || !userId) return;

    setLoading(true);
    try {
      const isEditing = !!editingTransaction;
      const tipoNuevo = formData.type.toLowerCase();
      const tipoViejo = editingTransaction?.type.toLowerCase();

      // determine base strings
      const baseNuevo = tipoNuevo === 'ingreso' ? 'Incomes' : 'Expenses';
      const baseViejo = tipoViejo === 'ingreso' ? 'Incomes' : 'Expenses';

      let newList = transactions;
      const body = buildBody(formData, userId);

      if (isEditing && tipoNuevo !== tipoViejo) {
        // change type: create new + delete old
        const created = await postTransactionOnServer({ base: baseNuevo, body, token });
        await deleteTransactionOnServer({ base: baseViejo, id: editingTransaction.id, token });
        // remove old and add new
        newList = transactions
          .filter(t => t.id !== editingTransaction.id)
          .concat({
            id:          created.id,
            ...body,
            date:        formData.date,
            type:        formData.type,
            category:    categories.find(c => c.id === body.categoryId)?.name || '',
            description: formData.description
          });

      } else if (isEditing) {
        // simple edit: update server then local
        await putTransactionOnServer({ base: baseNuevo, id: editingTransaction.id, body: { ...body, id: editingTransaction.id }, token });
        newList = replaceTransaction(transactions, {
          id:          editingTransaction.id,
          ...body,
          date:        formData.date,
          category:    categories.find(c => c.id === body.categoryId)?.name || '',
          description: formData.description
        });

      } else {
        // new transaction
        const created = await postTransactionOnServer({ base: baseNuevo, body, token });
        newList = addTransaction(transactions, {
          id:          created.id,
          ...body,
          date:        formData.date,
          type:        formData.type,
          category:    categories.find(c => c.id === body.categoryId)?.name || '',
          description: formData.description
        });
      }

      setTransactions(newList);
      setShowSuccess(true);
      setEditingTransaction(null);

    } catch (error) {
      //console.error("Error al crear/editar transacción:", error);

      // 1) Extraemos lo que venga de la API:
      const apiData = error.response?.data;

      // 2) Si viene un objeto con .message lo usamos,
      //    si viene una cadena (texto plano) la usamos tal cual,
      //    si no hay nada, fallback a error.message o un genérico.
      const msg =
        (apiData && typeof apiData === "object" && apiData.message) ||
        (typeof apiData === "string" && apiData) ||
        error.message ||
        "Ocurrió un error inesperado";

      // 3) Guardamos y mostramos
      setErrorMessage(msg);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (token, userId, isAdmin, categories) => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      let incomesRes, expensesRes;

      if (isAdmin) {
        [incomesRes, expensesRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/Incomes`, config),
          axios.get(`${BASE_URL}/api/Expenses`, config)
        ]);
      } else {
        [incomesRes, expensesRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/Incomes`, config),
          axios.get(`${BASE_URL}/api/Expenses`, config)
        ]);
      }

      const incomes = incomesRes.data.map(i => ({ ...i, type: "ingreso" }));
      const expenses = expensesRes.data
      .filter(e => e.tieneCuotas === false) // ✅ solo los gastos directos
      .map(e => ({ ...e, type: "gasto" }));

      const cuotasPagadas = await fetchCuotasPagadasDelMes(token, userId, monthOffset); // o calcularlo con fechas

      const cuotasConvertidas = cuotasPagadas.map(c => ({
        ...c,
        type: "cuota" // ✅ importante para diferenciar
      }));

      const allTransactions = [...incomes, ...expenses, ...cuotasConvertidas];

      const withCategoryNames = allTransactions.map(t => ({
        ...t,
        category: categories.find(c => c.id === t.categoryId)?.name || 'Sin categoría'
      }));

      setTransactions(withCategoryNames);

    } catch (error) {
      console.error("Error al cargar transacciones:", error);
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

  const fetchSummary = async (summaryUserId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!summaryUserId) {
      setErrorMessage("Por favor ingresa un User ID");
      setShowError(true);
      return;
    }

    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${BASE_URL}/api/Incomes/summary/${summaryUserId}`, config);

      if (response.data.totalIncome === 0 && response.data.totalExpenses === 0) {
        setNotFoundMessage(`No se encontraron datos para el usuario ${summaryUserId}`);
      } else {
        setNotFoundMessage("");
      }

      setSummaryData(response.data);
    } catch (error) {
      //console.error("Error al obtener el resumen:", error);

      const msg =
        error.response?.data?.title ||  // Si usás ProblemDetails
        error.response?.data ||        // Si es texto plano
        "No se pudo obtener el resumen del usuario.";

      setErrorMessage(msg);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const { userId, categoryId, from, to } = filterParams;

    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const query = new URLSearchParams({
        userId,
        categoryId,
        from,
        to
      });

      const response = await axios.get(`${BASE_URL}/api/Incomes/filter?${query}`, config);

      if (response.data.length === 0) {
      setNotFoundMessage(`No se encontraron datos para el usuario ${userId}`);
      } else {
        setNotFoundMessage(""); // limpiar si hay datos
      }

      setFilteredData(response.data);
    } catch (error) {
      //console.error("Error al obtener datos filtrados:", error);
      alert("No se pudieron obtener los datos filtrados.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'ingreso',
      category: '',
      amount: '',
      date: '',
      description: '',
      categoryId: ''
    });
    setEnCuotas(false);
  setCantidadCuotas('');
  setFechaInicioCuotas('');
    setEditingTransaction(null);
    setShowModal(false);
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      category: transaction.category || '',
      amount: transaction.amount,
      date: transaction.date.split('T')[0],
      description: transaction.description || '',
      categoryId: transaction.categoryId || ''
    });
    setShowModal(true);
  };

  const handleDelete = (transaction) => {
    setConfirmDelete({
      show: true,
      target: transaction,
      type: "transaction"
    });
  };

  // Pie chart data
  const chartData = [
  { name: "Ingresos", value: totalIncome },
  { name: "Gastos", value: totalExpenses }
  ];
      
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const payload = parseJwt(token);
    if (!payload) return;

    const userId = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
    const role = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    const isAdmin = role === "Admin";

    setUserId(userId);
    setIsAdmin(isAdmin);

    const init = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const categoriesRes = await axios.get(`${BASE_URL}/api/Categories`, config);
        setCategories(categoriesRes.data);

        await fetchTransactions(token, userId, isAdmin, categoriesRes.data);
      } catch (err) {
        console.error("Error al inicializar dashboard", err);
      }
    };

    init();
  }, [monthOffset]); 

  return (
    //<div className="min-h-screen dark:bg-gray-700 bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="
      min-h-screen 
      bg-gradient-to-br from-blue-50 to-indigo-100 
      dark:bg-gradient-to-br dark:from-gray-900 dark:to-black
      p-4
   ">
      <div className="max-w-7xl mx-auto dark:bg-gray-700">

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          
          <div className="flex flex-col md:flex-row items-center gap-4">

            {/* Chart View Selector */}
            <div className="flex bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1">
              <button
                onClick={() => setChartView('default')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all ${
                  chartView === 'default'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-500 dark:text-white'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                Tarjetas
              </button>
              <button
                onClick={() => setChartView('pie')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all ${
                  chartView === 'pie'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-500 dark:text-white'
                }`}
              >
                <PieChart className="w-4 h-4" />
                Torta
              </button>
              <button
                onClick={() => setChartView('temporal')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all ${
                  chartView === 'temporal'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-500 dark:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Temporal
              </button>
            </div>

            {/* Botón para abrir el Panel de Administración */}
            {isAdmin && !showAdminPanel && (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-all duration-200 shadow-lg"
              >
                Panel Admin
              </button>
            )}

          </div>

          {/* Feature para cambiar de Period */}
          <div className="flex items-center gap-2 mb-4 mt-4 mr-4">
            <button
              onClick={() => setMonthOffset(m => m - 1)}
              className="p-1 hover:bg-gray-100 dark:bg-white dark:hover:bg-gray-300 rounded"
            >
              <ChevronLeft />
            </button>
            <h5 className="text-lg font-semibold dark:text-white">
              {startOfThis.toLocaleDateString('es-AR',{ year:'numeric', month:'long' })}
            </h5>
            <button
              onClick={() => setMonthOffset(m => m + 1)}
              className="p-1 hover:bg-gray-100 dark:bg-white dark:hover:bg-gray-300 rounded"
            >
              <ChevronRight />
            </button>
          </div>

        </div>

        {/* Summary Cards / Charts */}
        <div className="mb-8">
          {chartView === 'default' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-white text-sm font-medium">Total Ingresos</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-white text-sm font-medium">Total Gastos</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-white text-sm font-medium">Balance</p>
                    <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(balance)}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {chartView === 'pie' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">Distribución de Ingresos vs Gastos</h3>
              <div className="flex flex-col lg:flex-row items-center gap-8 w-full">

                <div className="flex-1 w-full" style={{ minHeight: '400px' }}>
                  <ResponsiveContainer width="100%" height={400}>
                    <RechartsPieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent, x, y }) => (
                          <text
                            x={x}
                            y={y}
                            fill="#ffffff"
                            fontSize={14}
                            textAnchor="middle"
                            dominantBaseline="central"
                            style={{
                              textShadow: `
                                -1px -1px 2px #000, 
                                1px -1px 2px #000, 
                                -1px  1px 2px #000, 
                                1px  1px 2px #000`
                            }}
                          >
                            {`${name}: ${formatCurrency(value)} (${(percent * 100).toFixed(1)}%)`}
                          </text>
                        )}

                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex flex-col gap-4 lg:w-80">
                  <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500 dark:bg-gray-700">
                    <p className="text-gray-600 text-sm font-medium dark:text-white">Total Ingresos</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500 dark:bg-gray-700">
                    <p className="text-gray-600 text-sm font-medium dark:text-white">Total Gastos</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 dark:bg-gray-700">
                    <p className="text-gray-600 text-sm font-medium dark:text-white">Balance</p>
                    <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(balance)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {chartView === 'temporal' && (
            <TimeSeriesChart />
          )}

        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white">
            Transacciones Recientes
          </h2>
          
          <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Botón Gastos */}
            <button
              onClick={() => navigate('/expenses')}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 shadow-lg text-xs sm:text-base min-h-[44px]"
            >
              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Gastos</span>
            </button>
            
            {/* Botón Ingresos */}
            <button
              onClick={() => navigate('/incomes')}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 shadow-lg text-xs sm:text-base min-h-[44px]"
            >
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Ingresos</span>
            </button>
            
            {/* Botón Nueva Transacción - Ocupa toda la fila en móvil */}
            <button
              onClick={() => setShowModal(true)}
              className="col-span-2 sm:col-span-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 shadow-lg text-xs sm:text-base min-h-[44px]"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Nueva Transacción</span>
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[600px]">

              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Descripción</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
              {transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10).map((transaction) => (
                <tr key={`${transaction.type}-${transaction.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.type === 'ingreso' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type === 'ingreso' ? 'Ingreso' : 'Gasto'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {transaction.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      <span className={transaction.type === 'ingreso' ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(transaction.amount)}
                      </span>

                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(transaction.date)
                        .toLocaleDateString("es-AR", { timeZone: "UTC" })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="text-blue-600 hover:text-blue-900 transition-colors p-1 hover:bg-blue-50 dark:hover:bg-gray-400 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction)}
                          className="text-red-600 hover:text-red-900 transition-colors p-1 hover:bg-red-50 dark:hover:bg-gray-400 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-2">

              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 dark:text-white">
                  {editingTransaction ? 'Editar Transacción' : 'Nueva Transacción'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">Tipo</label>
                    <select
                      value={formData.type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setFormData({ ...formData, type: newType, categoryId: '' });
                        fetchCategoriesByType(newType);
                        // Resetear opciones de cuotas cuando cambia el tipo
                        if (e.target.value === 'ingreso') {
                          setEnCuotas(false);
                          setCantidadCuotas('');
                          setFechaInicioCuotas('');
                        }
                      }}
                      
                    >
                      <option value="ingreso">Ingreso</option>
                      <option value="gasto">Gasto</option>
                    </select>

                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">Categoría</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({...formData, categoryId: parseInt(e.target.value)})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/*Monto maximo 10M */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
                      Monto (máximo $10,000,000)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10000000"
                      value={formData.amount}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (value <= 10000000 || e.target.value === '') {
                          setFormData({...formData, amount: e.target.value});
                        }
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                    {formData.amount > 10000000 && (
                      <p className="text-red-500 text-sm mt-1">
                        El monto no puede exceder $10,000,000
                      </p>
                    )}
                  </div>

                  {/* Opción en cuotas - Solo para gastos */}
                  {formData.type === 'gasto' && (
                    <div>
                      <label className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-white">
                        <input
                          type="checkbox"
                          checked={enCuotas}
                          onChange={(e) => {
                            setEnCuotas(e.target.checked);
                            // Si se desactivan las cuotas, limpiar los campos relacionados
                            if (!e.target.checked) {
                              setCantidadCuotas('');
                              setFechaInicioCuotas('');
                            }
                          }}
                          className="form-checkbox h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2">¿Este gasto es en cuotas?</span>
                      </label>
                    </div>
                  )}

                  {/* Campos de cuotas - Solo si es gasto y está activado */}
                  {formData.type === 'gasto' && enCuotas && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
                          Cantidad de cuotas
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={cantidadCuotas}
                          onChange={(e) => setCantidadCuotas(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
                          Fecha de inicio de pago
                        </label>
                        <input
                          type="date"
                          value={fechaInicioCuotas}
                          onChange={(e) => setFechaInicioCuotas(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </>
                  )}

                  {/* Campo de fecha original - Solo si NO es gasto en cuotas */}
                  {!(formData.type === 'gasto' && enCuotas) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      placeholder="Descripción opcional..."
                    />
                  </div>

                  {formError && (
                    <div className="text-red-600 text-sm font-medium text-center mb-2">
                      {formError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 px-4 py-3 text-gray-700 bg-gray-200 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                    >
                      {editingTransaction ? 'Actualizar' : 'Agregar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
          
        
        {/* Modal del Panel de Administración */}
        {isAdmin && showAdminPanel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-hidden">

              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">Panel de Administración</h3>
                  <button onClick={() => setShowAdminPanel(false)} className="text-red-600 hover:text-red-800 text-lg font-bold px-3 py-1">
                      ✕
                    </button>
                  </div>

                {/* navegación admin */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4 px-3 sm:px-6">
                  <button
                    onClick={() => {
                      setAdminView('summary');
                      setNotFoundMessage("");
                    }}
                    className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                      adminView === 'summary' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Resumen por Usuario
                  </button>

                  <button
                    onClick={() => {
                      setAdminView('filter');
                      setNotFoundMessage("");
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      adminView === 'filter' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Filtrar Ingresos
                  </button>

                  <button
                    onClick={() => {
                      setAdminView('categories');
                      setNotFoundMessage("");
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      adminView === 'categories' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Administrar Categorías
                  </button>
                </div>

              </div>

                <div className="p-3 sm:p-6 overflow-y-auto max-h-[60vh] sm:max-h-[70vh]">
                  
                  {/* Contenido del Panel */}
                  {adminView === 'summary' && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">User ID</label>
                          <input
                            type="number"
                            value={summaryUserId}
                            onChange={(e) => setSummaryUserId(e.target.value)}
                            className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                            placeholder="Ej: 7"
                          />
                        </div>
                        <button
                          onClick={() => fetchSummary(summaryUserId)}
                          disabled={loading}
                          className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm sm:text-base w-full sm:w-auto"
                        >
                          {loading ? 'Cargando...' : 'Obtener Resumen'}
                        </button>
                      </div>

                      {notFoundMessage && (
                        <p className="text-red-600 text-sm font-medium mt-2 ml-1">
                          {notFoundMessage}
                        </p>
                      )}


                      {summaryData && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h5 className="font-semibold text-gray-800 mb-3">Resultados:</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 border-green-500">
                              <p className="text-sm text-gray-600 dark:text-white">Total Ingresos</p>
                              <p className="text-xl font-bold text-green-600">{formatCurrency(summaryData.totalIncome)}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 border-red-500">
                              <p className="text-sm text-gray-600 dark:text-white">Total Gastos</p>
                              <p className="text-xl font-bold text-red-600">{formatCurrency(summaryData.totalExpenses)}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 border-blue-500">
                              <p className="text-sm text-gray-600 dark:text-white">Balance</p>
                              <p className={`text-xl font-bold ${summaryData.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {formatCurrency(summaryData.balance)}
                              </p>
                            </div>
                          </div>
                      
                        </div>
                      )}
                    </div>
                  )}

                  {adminView === 'filter' && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Filtrar Ingresos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">User ID *</label>
                        <input
                          type="number"
                          value={filterParams.userId}
                          onChange={(e) => setFilterParams({...filterParams, userId: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ej: 7"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                          Categoría
                        </label>
                        <select
                          value={filterParams.categoryId ?? ""}
                          onChange={e =>
                            setFilterParams({
                              ...filterParams,
                              // si el valor es cadena vacía, lo dejamos sin valor; 
                              // si no, lo parseamos a entero
                              categoryId: e.target.value
                                ? parseInt(e.target.value, 10)
                                : undefined
                            })
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Seleccionar categoría</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Fecha Desde</label>
                        <input
                          type="datetime-local"
                          value={filterParams.from}
                          onChange={(e) => setFilterParams({...filterParams, from: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Fecha Hasta</label>
                        <input
                          type="datetime-local"
                          value={filterParams.to}
                          onChange={(e) => setFilterParams({...filterParams, to: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {notFoundMessage && adminView === 'filter' && (
                        <p className="text-red-600 text-sm font-medium mt-2 ml-4">{notFoundMessage}</p>
                      )}

                    </div>

                    <button
                      onClick={fetchFilteredData}
                      disabled={loading}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Cargando...' : 'Aplicar Filtros'}
                    </button>

                    {filteredData && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-800 mb-3">Resultados ({filteredData.length} registros):</h5>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-200">
                              <tr>
                                <th className="px-3 py-2 text-left">ID</th>
                                <th className="px-3 py-2 text-left">Monto</th>
                                <th className="px-3 py-2 text-left">Descripción</th>
                                <th className="px-3 py-2 text-left">Fecha</th>
                                <th className="px-3 py-2 text-left">Categoría</th>
                                <th className="px-3 py-2 text-left">Usuario</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {filteredData.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-100">
                                  <td className="px-3 py-2">{item.id}</td>
                                  <td className="px-3 py-2 font-semibold text-green-600">{formatCurrency(item.amount)}</td>
                                  <td className="px-3 py-2">{item.description}</td>
                                  <td className="px-3 py-2">{new Date(item.date).toLocaleDateString('es-AR')}</td>
                                  <td className="px-3 py-2">{item.categoryName}</td>
                                  <td className="px-3 py-2">{item.username} (ID: {item.userId})</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                    
                      </div>
                    )}
                    </div>
                  )}

                  {adminView === 'categories' && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold text-gray-800">
                        Categorías de {currentType === "gasto" ? "Gastos" : "Ingresos"}
                      </h4>

                      <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-700">Tipo:</label>
                        <select
                          value={currentType}
                          onChange={(e) => {
                            setCurrentType(e.target.value);
                            fetchCategoriesByType(e.target.value);
                          }}
                          className="border rounded p-2"
                        >
                          <option value="gasto">Gasto</option>
                          <option value="ingreso">Ingreso</option>
                        </select>
                      </div>

                      <ul className="space-y-2">
                        {categories.map((cat) => (
                          <li key={cat.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-gray-100 p-3 rounded gap-2">
                            {editingCategory?.id === cat.id ? (
                              <div className="flex flex-col sm:flex-row gap-2 w-full">
                              <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="border rounded p-2 flex-1"
                              />
                              <select
                                value={editingCategoryType || "gasto"} // fallback si está null
                                onChange={(e) => setEditingCategoryType(e.target.value)}
                                className="border rounded p-2 w-36"
                              >
                                <option value="ingreso">Ingreso</option>
                                <option value="gasto">Gasto</option>
                              </select>

                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <span>{cat.name}</span>
                              <span className="text-xs text-gray-500">({cat.type})</span>
                            </div>
                          )}


                            <div className="flex gap-2 flex-shrink-0">
                              {editingCategory?.id === cat.id ? (
                                <>
                                  <button
                                    onClick={() => {
                                      
                                      handleEditCategory({
                                        id: cat.id,
                                        name: newCategoryName,
                                        type: editingCategoryType
                                      });

                                      setEditingCategory(null);
                                    }}
                                    disabled={!newCategoryName.trim()}
                                    className="text-green-600 hover:text-green-800 px-3 py-1 rounded disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    onClick={() => setEditingCategory(null)}
                                    className="text-gray-600 hover:text-gray-800 px-3 py-1 rounded"
                                  >
                                    Cancelar
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingCategory(cat);
                                    setNewCategoryName(cat.name);
                                    setEditingCategoryType(cat.type);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded"
                                >
                                  Editar
                                </button>
                              )}
                              <button
                                onClick={() => setConfirmDelete({ show: true, target: cat, type: "category" })}
                                className="text-red-600"
                              >
                                Eliminar
                              </button>

                            </div>
                          </li>
                        ))}
                      </ul>


                      <form onSubmit={handleCreateCategory} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mt-4">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Nueva categoría"
                        className="p-3 border rounded col-span-2"
                      />
                      <select
                        value={newCategoryType}
                        onChange={(e) => setNewCategoryType(e.target.value)}
                        className="p-3 border rounded"
                      >
                        <option value="ingreso">Ingreso</option>
                        <option value="gasto">Gasto</option>
                      </select>
                      <button
                        type="submit"
                        disabled={!newCategoryName.trim()}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 col-span-1 sm:col-span-3"
                      >
                        Crear
                      </button>
                    </form>

                    </div>
                  )}

              </div>
            </div>
          </div>
        )}

      </div>

        {/* Modal de SucessModal */}
        {showSuccess && (
          <SuccessModal message="Cambios guardados correctamente." onClose={() => setShowSuccess(false)} />
        )}

        {/* Modal de ConfirmDeleteModal */}
        {confirmDelete.show && confirmDelete.target && (
          <ConfirmDeleteModal
            message={
              confirmDelete.type === "transaction"
                ? confirmDelete.target
                  ? `¿Estás seguro de eliminar esta transacción de ${formatCurrency(confirmDelete.target.amount)}?`
                  : "¿Estás seguro de eliminar esta transacción?"
                : confirmDelete.target
                  ? `¿Estás seguro de eliminar la categoría "${confirmDelete.target.name}"?`
                  : "¿Estás seguro de eliminar esta categoría?"
            }

            onCancel={() =>
              setConfirmDelete({ show: false, target: null, type: null })
            }

            onConfirm={async () => {
              const token = localStorage.getItem("token");
              const item = confirmDelete.target;
              console.log("Deleting item:", item);

              if (!token || !item) return;

              try {
                const config = { headers: { Authorization: `Bearer ${token}` } };

                if (confirmDelete.type === "transaction") {
                  let idToDelete;

                  // Si es una cuota, usamos expenseId para eliminar el gasto completo
                  if (item.type === "cuota" && item.expenseId) {
                    idToDelete = item.expenseId;
                  } else {
                    idToDelete = item.id;
                  }

                  const base = item.type === "ingreso" ? "Incomes" : "Expenses";

                  await axios.delete(`${BASE_URL}/api/${base}/${idToDelete}`, config);

                  // Filtrar transacciones del estado
                  setTransactions(prev => {
                    if (item.type === "cuota" && item.expenseId) {
                      // Eliminamos todas las cuotas asociadas al mismo gasto
                      return prev.filter(t => t.expenseId !== item.expenseId);
                    } else {
                      return prev.filter(t => t.id !== item.id);
                    }
                  });

                } else if (confirmDelete.type === "category") {
                  await axios.delete(`${BASE_URL}/api/Categories/${item.id}`, config);
                  fetchCategoriesByType(currentType);
                }

                setShowSuccess(true);

              } catch (err) {
                setShowError(true);
              } finally {
                setConfirmDelete({ show: false, target: null, type: null });
              }
            }}
          />
        )}



        {/* Modal de ErrorModal */}
        {showError && (
          <ErrorModal message={errorMessage} onClose={() => setShowError(false)} />
        )}
    </div>
  );
};

export default Dashboard;