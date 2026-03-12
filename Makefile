install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

dev-backend:
	cd backend && uvicorn main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

dev:
	make dev-backend & make dev-frontend

docker-up:
	docker compose up --build

docker-down:
	docker compose down -v

test:
	cd backend && python -m pytest test_backpressure.py -v

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -name "*.pyc" -delete
	rm -rf backend/data/*.db
	rm -rf frontend/dist
	rm -rf frontend/node_modules

logs:
	docker compose logs -f
