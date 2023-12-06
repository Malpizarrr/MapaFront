import { h, Component } from 'preact';
import {
    agregarNodoAPI,
    obtenerNodosAPI,
    obtenerAristasAPI,
    agregarAristaAPI,
    eliminarNodoAPI,
    eliminarAristaAPI
} from './api';

class MapaYRutas extends Component {
    state = {
        marcadores: [],
        aristasMapa: [],
        nodos: [],
        aristas: [],
        rutaDetalles: null,
        map: null,
        directionsService: null,
        directionsRenderer: null,
        cursorX: 'N/A',
        cursorY: 'N/A',
        aristaLineasMapa: {},
        origenId: '',
        rutaPolyline: null,
        destinoId: '',
        modoRuta: 'DRIVING'
    };

    exportarDatos = () => {
        exportarNodosYAristasAPI();
    };

    generarIdArista() {
        const fecha = new Date().getTime(); // Obtiene el tiempo actual en milisegundos
        const aleatorio = Math.floor(Math.random() * 1000); // Genera un número aleatorio entre 0 y 999
        return aleatorio;
    }


    importarDatos = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (e) => {
            const file = e.target.files[0];
            importarNodosYAristasAPI(file).then(() => {
                this.obtenerNodosYActualizar();
                this.obtenerAristasYActualizar();
            }).catch(error => {
                console.error('Error al importar:', error);
            });
        };
        input.click();
    };

    obtenerNodosYActualizar = () => {
        obtenerNodosAPI().then(nodos => {
            const nodosFiltrados = nodos.filter(nodo => nodo != null);
            this.setState({ nodos: nodosFiltrados }, () => {
                this.actualizarMarcadores();
            });
        }).catch(error => console.error('Error al obtener nodos:', error));
    };

    obtenerAristasYActualizar = () => {
        obtenerAristasAPI().then(aristas => {
            console.log(this.state.aristas); // Imprime las aristas para depuración
            const aristasFiltradas = aristas.filter(arista => arista != null);
            this.setState({ aristas: aristasFiltradas }, () => {
                this.actualizarAristasMapa();
            });
        }).catch(error => console.error('Error al obtener aristas:', error));
    };

    actualizarMarcadores = () => {
        // Eliminar los marcadores antiguos del mapa
        this.state.marcadores.forEach(marcador => marcador.marker.setMap(null));

        // Agregar nuevos marcadores
        this.state.nodos.forEach(nodo => {
            this.agregarMarcador(nodo);
        });
    };

    agregarAristaMapa = (arista) => {
        const origenMarcador = this.state.marcadores.find(m => m.id === arista.origen.id);
        const destinoMarcador = this.state.marcadores.find(m => m.id === arista.destino.id);

        if (origenMarcador && destinoMarcador) {
            const aristaPath = new google.maps.Polyline({
                path: [origenMarcador.marker.getPosition(), destinoMarcador.marker.getPosition()],
                geodesic: true,
                strokeColor: '#FF0000',
                strokeOpacity: 1.0,
                strokeWeight: 2,
                map: this.state.map,
            });
            arista.mapaReferencia = aristaPath;
            this.setState(prevState => ({
                aristasMapa: [...prevState.aristasMapa, aristaPath],
            }));


        }
    };

    actualizarAristasMapa = () => {
        // Eliminar las aristas antiguas del mapa
        this.state.aristasMapa.forEach(arista => arista.setMap(null));

        // Vaciar el array de aristas del mapa y agregar las nuevas aristas
        this.setState({ aristasMapa: [] }, () => {
            this.state.aristas.forEach(arista => {
                this.agregarAristaMapa(arista);
            });
        });
    };

    componentDidMount() {
        console.log(this.state.nodos); // Para ver los nodos
        console.log(this.state.aristas); // Para ver las aristas
        if (window.google) {
            this.initMap();
        } else {
            window.initMap = this.initMap;
        }
    }

    initMap = () => {
        const map = new google.maps.Map(this.mapRef, {
            center: { lat: 9.7489, lng: -83.7534 },
            zoom: 8
        });

        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer();
        directionsRenderer.setMap(map);

        this.setState({ map, directionsService, directionsRenderer });

        map.addListener('click', this.agregarNodoEnClick);
        map.addListener('mousemove', this.actualizarCoordenadas);

        this.obtenerNodos();
        this.obtenerAristas();
    };

    actualizarCoordenadas = (e) => {
        this.setState({
            cursorX: e.latLng.lat().toFixed(6),
            cursorY: e.latLng.lng().toFixed(6)
        });
    };



    agregarNodoEnClick = (e) => {
        const id = prompt('Ingrese el ID para el nuevo nodo:');
        if (id) {
            const nodoData = {
                id: parseInt(id, 10),
                x: e.latLng.lat(),
                y: e.latLng.lng()
            };

            this.agregarNodo(nodoData);
        }
    };

    agregarNodo = (nodoData) => {
        agregarNodoAPI(nodoData).then(nodo => {
            this.agregarMarcador(nodo);
            this.obtenerNodos(); // Actualizar la lista de nodos
        }).catch(error => console.error('Error al agregar nodo:', error));
    };

    agregarMarcador = (nodo) => {
        const marker = new google.maps.Marker({
            position: { lat: nodo.x, lng: nodo.y },
            map: this.state.map,
            title: `Nodo ${nodo.id}`
        });

        this.setState(prevState => ({
            marcadores: [...prevState.marcadores, { id: nodo.id, marker }]
        }));
    };

    obtenerNodos = () => {
        obtenerNodosAPI().then(nodos => {
            const nodosFiltrados = nodos.filter(nodo => nodo != null);
            this.setState({ nodos: nodosFiltrados });
            nodosFiltrados.forEach(nodo => {
                this.agregarMarcador(nodo);
            });
        }).catch(error => console.error('Error al obtener nodos:', error));
    };


    obtenerAristas = () => {
        obtenerAristasAPI().then(aristas => {
            const aristasFiltradas = aristas.filter(arista => arista != null);
            this.setState({ aristas: aristasFiltradas });
            aristasFiltradas.forEach(arista => {
                this.agregarAristaMapa(arista);
            });
        }).catch(error => console.error('Error al obtener aristas:', error));
    };


    calcularRuta = (e) => {
        e.preventDefault();
        const { origenId, destinoId, marcadores, directionsService, map, rutaPolyline, modoRuta } = this.state;

        // Eliminar la polilínea anterior si existe
        if (rutaPolyline) {
            rutaPolyline.setMap(null);
        }

        const origenMarcador = marcadores.find(m => m.id === parseInt(origenId));
        const destinoMarcador = marcadores.find(m => m.id === parseInt(destinoId));

        if (origenMarcador && destinoMarcador) {
            const origen = origenMarcador.marker.getPosition();
            const destino = destinoMarcador.marker.getPosition();

            directionsService.route({
                origin: origen,
                destination: destino,
                travelMode: modoRuta
            }, (response, status) => {
                if (status === 'OK') {
                    const ruta = response.routes[0];
                    const detallesRuta = ruta.legs[0];

                    // Crear una nueva polilínea para la ruta
                    const nuevaRutaPolyline = new google.maps.Polyline({
                        path: ruta.overview_path,
                        geodesic: true,
                        strokeColor: 'rgba(1,91,255,0.57)',
                        strokeOpacity: 1.0,
                        strokeWeight: 4,
                        map: map
                    });

                    // InfoWindow para mostrar detalles
                    const infoWindow = new google.maps.InfoWindow();

                    google.maps.event.addListener(nuevaRutaPolyline, 'mouseover', (event) => {
                        infoWindow.setContent(`Distancia: ${detallesRuta.distance.text}, Duración: ${detallesRuta.duration.text}`);
                        infoWindow.setPosition(event.latLng);
                        infoWindow.open(map);
                    });

                    google.maps.event.addListener(nuevaRutaPolyline, 'mouseout', () => {
                        infoWindow.close();
                    });

                    // Actualizar el estado con la nueva polilínea
                    this.setState({
                        rutaDetalles: {
                            distancia: detallesRuta.distance.text,
                            duracion: detallesRuta.duration.text
                        },
                        rutaPolyline: nuevaRutaPolyline
                    });
                } else {
                    window.alert('No se pudo calcular la ruta debido a: ' + status);
                }
            });
        } else {
            window.alert('No se pudieron encontrar los marcadores de origen y destino.');
        }
    };






    agregarArista = () => {
        const { origenId, destinoId } = this.state;
        const origenMarcador = this.state.marcadores.find(m => m.id === parseInt(origenId));
        const destinoMarcador = this.state.marcadores.find(m => m.id === parseInt(destinoId));

        if (!origenMarcador || !destinoMarcador) {
            alert('Nodos de inicio o fin no encontrados');
            return;
        }

        const origenLatLng = origenMarcador.marker.getPosition();
        const destinoLatLng = destinoMarcador.marker.getPosition();
        const distancia = this.calcularDistancia(origenLatLng, destinoLatLng);

        const aristaData = {
            id: this.generarIdArista(),
            origen: {
                id: origenMarcador.id,
                x: origenLatLng.lat(),
                y: origenLatLng.lng()
            },
            destino: {
                id: destinoMarcador.id,
                x: destinoLatLng.lat(),
                y: destinoLatLng.lng()
            },
            peso: distancia
        };

        agregarAristaAPI(aristaData)
            .then(arista => {
                this.agregarAristaMapa(arista);
                this.obtenerAristas();
            })
            .catch(error => console.error('Error:', error));

        obtenerAristas();

    };

    eliminarNodo = (id) => {
        eliminarNodoAPI(id).then(() => {
            // Eliminar las aristas del nodo del estado y del mapa
            const aristasRelacionadas = this.state.aristas.filter(arista =>
                arista.origen.id === id || arista.destino.id === id
            );

            // Eliminar las polilíneas de las aristas relacionadas del mapa
            aristasRelacionadas.forEach(arista => {
                const aristaMapa = this.state.aristasMapa.find(a => a === arista.mapaReferencia);
                if (aristaMapa) {
                    aristaMapa.setMap(null);
                }
            });

            // Actualizar el estado para reflejar la eliminación de las aristas
            this.setState(prevState => ({
                aristas: prevState.aristas.filter(arista =>
                    arista.origen.id !== id && arista.destino.id !== id
                ),
                aristasMapa: prevState.aristasMapa.filter(aristaMapa =>
                    !aristasRelacionadas.includes(aristaMapa)
                )
            }));

            // Refrescar los nodos y aristas para obtener el estado actualizado
            this.obtenerNodosYActualizar();
            this.obtenerAristasYActualizar();
        }).catch(error => console.error('Error al eliminar nodo:', error));
    };




    eliminarArista = (id) => {
        eliminarAristaAPI(id).then(() => {
            // Actualiza el estado o realiza alguna acción después de la eliminación
            this.obtenerAristasYActualizar();
        }).catch(error => console.error('Error al eliminar arista:', error));
    };

    calcularDistancia = (origen, destino) => {
        const R = 6371; // Radio de la Tierra en km
        const dLat = this.toRad(destino.lat() - origen.lat());
        const dLng = this.toRad(destino.lng() - origen.lng());
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(origen.lat())) * Math.cos(this.toRad(destino.lat())) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    toRad = (value) => {
        return value * Math.PI / 180;
    };

    handleInputChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    };

    render() {
        return (
            <div className="container">
                {/* Contenedor del Mapa */}
                <div className="map-container" ref={el => this.mapRef = el}></div>

                {/* Contenedor de Formularios y Tablas */}
                <div className="formularios-tablas">
                    {/* Título Principal */}
                    <h1>Mapa y Rutas</h1>

                    {/* Contenedor de Coordenadas */}
                    <div id="coordinates">
                        <strong>Coordenadas del Cursor:</strong>
                        <div>X: <span>{this.state.cursorX}</span></div>
                        <div>Y: <span>{this.state.cursorY}</span></div>
                    </div>
                <h2>Agregar Nodo</h2>
                <form onSubmit={this.agregarNodo}>
                    <div className="form-group">
                        <label>ID del Nodo</label>
                        <input type="number" name="nodoId" placeholder="ID del nodo" required />
                    </div>
                    <div className="form-group">
                        <label>Coordenada X</label>
                        <input type="number" name="nodoX" placeholder="Coordenada X" required />
                    </div>
                    <div className="form-group">
                        <label>Coordenada Y</label>
                        <input type="number" name="nodoY" placeholder="Coordenada Y" required />
                    </div>
                    <div className="form-group">
                        <button type="submit">Agregar Nodo</button>
                    </div>
                </form>

                <h2>Agregar Arista</h2>
                <form onSubmit={this.agregarArista}>
                    <div className="form-group">
                        <label>ID de Origen</label>
                        <input type="number" name="origenId" value={this.state.origenId} onChange={this.handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label>ID de Destino</label>
                        <input type="number" name="destinoId" value={this.state.destinoId} onChange={this.handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <button type="submit">Agregar Arista</button>
                    </div>
                </form>

                <h2>Nodos Agregados</h2>
                <table>
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Latitud</th>
                        <th>Longitud</th>
                    </tr>
                    </thead>
                    <tbody>
                    {this.state.nodos.map(nodo => (
                        <tr key={nodo.id}>
                            <td>{nodo.id}</td>
                            <td>{nodo.x}</td>
                            <td>{nodo.y}</td>
                            <td><button onClick={() => this.eliminarNodo(nodo.id)}>Eliminar</button></td>
                        </tr>
                    ))}

                    </tbody>
                </table>

                    <h2>Aristas Agregadas</h2>
                    <table>
                        <thead>
                        <tr>
                            <th>ID Arista</th>
                            <th>ID de Origen</th>
                            <th>ID de Destino</th>
                            <th>Peso</th>
                        </tr>
                        </thead>
                        <tbody>
                        {this.state.aristas.map(arista => (
                            <tr key={arista.id}>
                                <td>{arista.id}</td>
                                <td>{arista.origen.id}</td>
                                <td>{arista.destino.id}</td>
                                <td>{arista.peso}</td>
                                <td><button onClick={() => this.eliminarArista(arista.id)}>Eliminar</button></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                <h2>Calcular Ruta Más Corta</h2>
                    <form onSubmit={this.calcularRuta}>
                        <div className={"form-group"}>
                        <label>
                            ID de Origen:
                            <input
                                type="number"
                                name="origenId"
                                value={this.state.origenId}
                                onChange={this.handleInputChange}
                                required
                            />
                        </label>
                        </div>
                        <div className={"form-group"}>
                        <label>
                            ID de Destino:
                            <input
                                type="number"
                                name="destinoId"
                                value={this.state.destinoId}
                                onChange={this.handleInputChange}
                                required
                            />
                        </label>
                        </div>
                        <div className={"form-group"}>
                        <button type="submit">Calcular Ruta</button>
                        </div>
                        <div className={"form-group-choose"}>
                            <button onClick={() => this.setState({ modoRuta: 'DRIVING' })}>Modo Vehículo</button>
                            <button onClick={() => this.setState({ modoRuta: 'WALKING' })}>Modo Peatonal</button>
                            <button onClick={() => this.setState({ modoRuta: 'BICYCLING' })}>Modo Ciclista</button>
                            <button onClick={() => this.setState({ modoRuta: 'TRANSIT' })}>Modo Transporte Público</button>
                        </div>
                    </form>
                    <h2>Resultados de la Ruta</h2>
                    <div id="rutaResultados">
                        {this.state.rutaDetalles && (
                            <div>
                                <p>Distancia: {this.state.rutaDetalles.distancia}</p>
                                <p>Duración: {this.state.rutaDetalles.duracion}</p>
                            </div>
                        )}
                    </div>


                    <button onClick={this.exportarDatos}>Exportar Nodos y Aristas</button>

                    <button onClick={this.importarDatos}>Importar Nodos y Aristas</button>
                </div>
            </div>
        );
    }
}

export default MapaYRutas;