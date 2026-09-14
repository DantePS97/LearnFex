// src/repositories/resultRepository.js

const results = [];

/**
 * Guardar un nuevo resultado
 */
export const saveResult = (result) => {
  if (!result) {
    throw new Error("El resultado es obligatorio.");
  }

  const newResult = {
    id: results.length + 1,
    ...result,
    createdAt: new Date().toISOString()
  };

  results.push(newResult);

  return newResult;
};

/**
 * Obtener todos los resultados
 */
export const getAllResults = () => {
  return results;
};

/**
 * Obtener un resultado por su ID
 */
export const getResultById = (id) => {
  return (
    results.find(
      (result) => result.id === Number(id)
    ) || null
  );
};

/**
 * Obtener resultados de un área específica
 */
export const getResultsByAreaId = (areaId) => {
  return results.filter(
    (result) =>
      Number(result.areaId) === Number(areaId)
  );
};

/**
 * Obtener los resultados de un usuario
 */
export const getResultsByUserId = (userId) => {
  return results.filter(
    (result) =>
      Number(result.userId) === Number(userId)
  );
};

/**
 * Obtener el último resultado registrado
 */
export const getLastResult = () => {
  if (results.length === 0) {
    return null;
  }

  return results[results.length - 1];
};

/**
 * Obtener los resultados más recientes
 */
export const getRecentResults = (limit = 5) => {
  return results
    .slice()
    .reverse()
    .slice(0, limit);
};

export const getRecentResultsByUser = (limit = 5) => {
  return results
    .slice()
    .reverse()
    .slice(0, limit);
};

/**
 * Actualizar un resultado
 */
export const updateResult = (id, updatedData) => {
  const index = results.findIndex(
    (result) => result.id === Number(id)
  );

  if (index === -1) {
    return null;
  }

  results[index] = {
    ...results[index],
    ...updatedData
  };

  return results[index];
};

/**
 * Eliminar un resultado
 */
export const deleteResult = (id) => {
  const index = results.findIndex(
    (result) => result.id === Number(id)
  );

  if (index === -1) {
    return false;
  }

  results.splice(index, 1);

  return true;
};

/**
 * Eliminar todos los resultados
 */
export const clearResults = () => {
  results.length = 0;
};

/**
 * Obtener cantidad de resultados
 */
export const getResultsCount = () => {
  return results.length;
};

export default {
  saveResult,
  getAllResults,
  getResultById,
  getResultsByAreaId,
  getResultsByUserId,
  getLastResult,
  getRecentResults,
  updateResult,
  deleteResult,
  clearResults,
  getResultsCount
};