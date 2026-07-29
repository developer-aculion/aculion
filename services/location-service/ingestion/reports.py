import json
import time
from ingestion.config import REPORTS_DIR
from ingestion.logger import logger

def compile_and_save_report(report_data):
    """
    Saves a JSON execution log report under reports/.
    """
    timestamp = int(time.time())
    report_file = REPORTS_DIR / f"ingestion_report_{timestamp}.json"
    
    report = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_files": len(report_data),
        "success_count": sum(1 for r in report_data if r["status"] == "Success"),
        "failed_count": sum(1 for r in report_data if r["status"] == "Failed"),
        "skipped_count": sum(1 for r in report_data if r["status"] == "Skipped"),
        "total_duration_seconds": round(sum(r["duration_seconds"] for r in report_data), 2),
        "details": report_data
    }
    
    try:
        with open(report_file, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=4)
        logger.info(f"Ingestion run report successfully written to {report_file}")
    except Exception as e:
        logger.error(f"Failed to save ingestion report: {e}")
        
    return report
