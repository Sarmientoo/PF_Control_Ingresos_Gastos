import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/** POST a new transaction in the given base ('Incomes'|'Expenses') */
export async function postTransactionOnServer({ base, body, token }) {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const res = await axios.post(
    `${BASE_URL}/api/${base}`,
    body,
    config
  );
  return res.data;
}

/** PUT to update an existing transaction */
export async function putTransactionOnServer({ base, id, body, token }) {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  await axios.put(
    `${BASE_URL}/api/${base}/${id}`,
    body,
    config
  );
}

/** DELETE a transaction by id */
export async function deleteTransactionOnServer({ base, id, token }) {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  await axios.delete(
    `${BASE_URL}/api/${base}/${id}`,
    config
  );
}

/** Build transaction body from formData */
export function buildBody(formData, userId) {
  return {
    amount:      parseFloat(formData.amount),
    description: formData.description,
    date:        new Date(formData.date).toISOString(),
    categoryId:  Number(formData.categoryId),
    userId:      Number(userId)
  };
}

/** Replace an existing transaction in array */
export function replaceTransaction(transactions, updated) {
  return transactions.map(t =>
    t.id === updated.id ? { ...t, ...updated } : t
  );
}

/** Add a new transaction to array */
export function addTransaction(transactions, newTx) {
  return [...transactions, newTx];
}
