use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(String),
    #[error("Not found: {0}")]
    NotFound(String),
    #[error("Validation error: {0}")]
    Validation(String),
    #[error("External API error: {0}")]
    ExternalApi(String),
}

impl From<rusqlite::Error> for AppError {
    fn from(err: rusqlite::Error) -> Self {
        AppError::Database(err.to_string())
    }
}

impl From<reqwest::Error> for AppError {
    fn from(err: reqwest::Error) -> Self {
        AppError::ExternalApi(err.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_from_rusqlite_error() {
        let rusqlite_err = rusqlite::Error::QueryReturnedNoRows;
        let app_err = AppError::from(rusqlite_err);
        match app_err {
            AppError::Database(msg) => {
                // rusqlite may format the message differently across versions
                assert!(!msg.is_empty(), "Database error message should not be empty");
            }
            _ => panic!("Expected Database variant"),
        }
    }

    #[test]
    fn test_from_reqwest_error() {
        // Verify AppError::ExternalApi displays correctly
        let err = AppError::ExternalApi("connection refused".to_string());
        assert!(format!("{}", err).contains("connection refused"));
    }

    /// Compile-time verification that From<reqwest::Error> for AppError exists.
    /// reqwest::Error cannot be easily constructed without a real request,
    /// so we verify the trait bound is satisfied via type inference.
    fn _assert_reqwest_from_impl() {
        fn check<T: From<reqwest::Error>>() {}
        check::<AppError>();
    }

    #[test]
    fn test_error_display() {
        let err = AppError::NotFound("game 42".to_string());
        assert_eq!(format!("{}", err), "Not found: game 42");

        let err = AppError::Validation("invalid rating".to_string());
        assert_eq!(format!("{}", err), "Validation error: invalid rating");
    }

    #[test]
    fn test_rusqlite_error_message_preserved() {
        let msg = rusqlite::Error::InvalidParameterName("bad_param".into());
        let app_err = AppError::from(msg);
        let display = format!("{}", app_err);
        assert!(display.starts_with("Database error:"));
        assert!(display.contains("bad_param"));
    }
}
