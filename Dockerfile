# Imagen del conversor MarkItDown.
# Python 3.13 fijo -> sin líos de versiones (el problema de Python 3.14 no aplica
# dentro del contenedor).
FROM python:3.13-slim

# No generar .pyc y salida sin buffer (logs en tiempo real).
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HOST=0.0.0.0 \
    PORT=5000 \
    NO_BROWSER=1

WORKDIR /app

# Dependencias primero (mejor cacheo de capas).
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Código de la app.
COPY app.py .
COPY templates/ templates/
COPY static/ static/

# La conversión real ocurre aquí dentro; los .md se guardan en /app/output,
# que se monta a una carpeta de tu máquina (ver docker-compose.yml).
EXPOSE 5000

CMD ["python", "app.py"]
