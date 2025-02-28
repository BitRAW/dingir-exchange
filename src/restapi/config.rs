use config_rs::{Config, File};
use serde::{Deserialize, Serialize};

#[derive(Debug, PartialEq, Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct Trading {
    #[serde(with = "humantime_serde")]
    pub ticker_update_interval: std::time::Duration,
    #[serde(with = "humantime_serde")]
    pub ticker_interval: std::time::Duration,
}

impl Default for Trading {
    fn default() -> Self {
        Trading {
            ticker_update_interval: std::time::Duration::from_secs(5),
            ticker_interval: std::time::Duration::from_secs(86_400),
        }
    }
}

#[derive(Debug, PartialEq, Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct Settings {
    pub workers: Option<usize>,
    pub manage_endpoint: Option<String>,
    pub trading: Trading,
}

impl Default for Settings {
    fn default() -> Self {
        Settings {
            workers: None,
            manage_endpoint: None,
            trading: Default::default(),
        }
    }
}

impl Settings {
    pub fn new() -> Self {
        let mut conf = Config::default();
        conf.merge(File::with_name("config/restapi/default")).unwrap();

        // Merges with `config/RUN_MODE.yaml` (development as default).
        let run_mode = dotenv::var("RUN_MODE").unwrap_or_else(|_| "development".into());
        conf.merge(File::with_name(&format!("config/restapi/{}", run_mode)).required(false))
            .unwrap();

        conf.try_into().unwrap()
    }
}
