const root_url = "https://mapaback-production.up.railway.app/api/grafo";

export const agregarNodoAPI = (nodoData) => {
    return fetch(root_url+"/nodos", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodoData)
    }).then(response => response.json());
};

export const obtenerNodosAPI = () => {
    return fetch(root_url+"/nodos")
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error en la solicitud: ${response.status}`);
            }
            if (response.status === 204 || response.headers.get("content-length") === "0") {
                return [];
            } else {
                return response.json();
            }
        })
        .catch(error => {
            console.error('Error al obtener Nodos:', error);
            throw error; // O manejar el error de manera adecuada
        });
};


export const agregarAristaAPI = (aristaData) => {
    return fetch(root_url+"/aristas", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aristaData)
    }).then(response => response.json());
};

export const obtenerAristasAPI = () => {
    return fetch(root_url+"/aristas")
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error en la solicitud: ${response.status}`);
            }
            if (response.status === 204 || response.headers.get("content-length") === "0") {
                return [];
            } else {
                return response.json();
            }
        })
        .catch(error => {
            console.error('Error al obtener aristas:', error);
            throw error;
        });
};

export const eliminarNodoAPI = (id) => {
    return fetch(root_url+"/nodos"+id, {
        method: 'DELETE'
    }).then(response => {
        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status}`);
        }
        if (response.status === 204 || response.headers.get("content-length") === "0") {
            return [];
        } else {
            return response.json();
        }
    })
        .catch(error => {
            console.error('Error al eliminar Nodos:', error);
            throw error;
        });
};

export const eliminarAristaAPI = (id) => {
    return fetch(root_url+"/aristas"+id, {
        method: 'DELETE'
    }).then(response => {
        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status}`);
        }
        if (response.status === 204 || response.headers.get("content-length") === "0") {
            return [];
        } else {
            return response.json();
        }
    })
        .catch(error => {
            console.error('Error al eliminar Aristas:', error);
            throw error;
        });
};



