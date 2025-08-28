# backend/app/services/rag.py
import pinecone
import os

# Simulación de un vector store
dummy_data = {
    "playa": "La playa de Copacabana en Río de Janeiro es famosa por su arena blanca y sus fiestas.",
    "museo": "El Louvre en París alberga la Mona Lisa y es uno de los museos más grandes del mundo.",
    "montaña": "El Everest es la montaña más alta de la Tierra y se encuentra en la cordillera del Himalaya.",
}


def get_relevant_info(query: str) -> str:
    """
    Función que simula una búsqueda RAG para obtener información relevante.
    En un proyecto real, esto usaría la API de Pinecone para buscar en un índice.
    """
    # Lógica de búsqueda simple con datos dummy
    query_lower = query.lower()
    for keyword, info in dummy_data.items():
        if keyword in query_lower:
            return info

    # Simulación de un resultado vacío
    return "No se encontró información relevante para tu consulta en nuestra base de datos."

# Si quisieras implementar Pinecone
# from pinecone import Pinecone
# from sentence_transformers import SentenceTransformer

# pinecone_api_key = os.getenv("PINECONE_API_KEY")
# pinecone_env = os.getenv("PINECONE_ENVIRONMENT")

# pc = Pinecone(api_key=pinecone_api_key)
# index_name = "travel-data-index"

# def get_relevant_info_pinecone(query: str) -> str:
#     index = pc.Index(index_name)
#     model = SentenceTransformer('all-MiniLM-L6-v2')
#     vector = model.encode(query).tolist()
#     results = index.query(vector, top_k=5, include_metadata=True)
#     # Procesar los resultados y devolver la información
#     return "Información obtenida de Pinecone..."