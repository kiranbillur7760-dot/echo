import sys
import os

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database.session import Base, engine, SessionLocal
from app.services.seed_data import seed_database

def main():
    print("Initializing Project Echo database schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
        print("Database seeding completed successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
