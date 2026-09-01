import sys

import uvicorn

from app.database import Base, engine, test_connection
from app.main import app as application
import app.models

if __name__ == "__main__":
    if "--setup-only" in sys.argv:
        if test_connection():
            Base.metadata.create_all(bind=engine)
            raise SystemExit(0)
        raise SystemExit(1)

    uvicorn.run(application, host="0.0.0.0", port=8000, reload=False)