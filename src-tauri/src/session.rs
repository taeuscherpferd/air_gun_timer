use rand::Rng;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimerStep {
    pub duration_mode: TimerDurationMode,
    pub fixed_seconds: u64,
    pub min_seconds: u64,
    pub max_seconds: u64,
    pub enabled: bool,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum TimerDurationMode {
    Fixed,
    Random,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SelectionOption {
    pub id: String,
    pub label: String,
    pub weight: u64,
    pub enabled: bool,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SelectionResult {
    pub option_id: String,
    pub label: String,
    pub option_index: usize,
}

pub fn resolve_duration(timer: &TimerStep) -> Result<u64, String> {
    if !timer.enabled {
        return Err("Timer is disabled.".to_string());
    }

    match timer.duration_mode {
        TimerDurationMode::Fixed => normalize_seconds(timer.fixed_seconds),
        TimerDurationMode::Random => random_duration(timer.min_seconds, timer.max_seconds),
    }
}

pub fn pick_option(options: &[SelectionOption]) -> Result<SelectionResult, String> {
    let eligible_options: Vec<(usize, &SelectionOption)> = options
        .iter()
        .enumerate()
        .filter(|(_, option)| option.enabled && option.weight > 0)
        .collect();

    if eligible_options.is_empty() {
        return Err("At least one enabled option with weight is required.".to_string());
    }

    let total_weight = eligible_options
        .iter()
        .fold(0_u64, |total, (_, option)| total + option.weight);
    let target = rand::thread_rng().gen_range(0..total_weight);

    pick_option_with_target(&eligible_options, target)
}

fn normalize_seconds(value: u64) -> Result<u64, String> {
    if value == 0 {
        return Err("Timer duration must be at least one second.".to_string());
    }

    Ok(value)
}

fn random_duration(min_seconds: u64, max_seconds: u64) -> Result<u64, String> {
    let min_seconds = normalize_seconds(min_seconds)?;

    if max_seconds < min_seconds {
        return Err(
            "Random timer maximum must be greater than or equal to the minimum.".to_string(),
        );
    }

    Ok(rand::thread_rng().gen_range(min_seconds..=max_seconds))
}

fn pick_option_with_target(
    eligible_options: &[(usize, &SelectionOption)],
    mut target: u64,
) -> Result<SelectionResult, String> {
    for (index, option) in eligible_options {
        if target < option.weight {
            return Ok(SelectionResult {
                option_id: option.id.clone(),
                label: selection_label(&option.label),
                option_index: *index,
            });
        }

        target -= option.weight;
    }

    Err("Random option target was outside the available weight range.".to_string())
}

fn selection_label(label: &str) -> String {
    let trimmed_label = label.trim();

    if trimmed_label.is_empty() {
        return "Option".to_string();
    }

    trimmed_label.to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fixed_timer(seconds: u64) -> TimerStep {
        TimerStep {
            duration_mode: TimerDurationMode::Fixed,
            fixed_seconds: seconds,
            min_seconds: 10,
            max_seconds: 20,
            enabled: true,
        }
    }

    fn random_timer(min_seconds: u64, max_seconds: u64) -> TimerStep {
        TimerStep {
            duration_mode: TimerDurationMode::Random,
            fixed_seconds: 30,
            min_seconds,
            max_seconds,
            enabled: true,
        }
    }

    fn option(id: &str, weight: u64, enabled: bool) -> SelectionOption {
        SelectionOption {
            id: id.to_string(),
            label: id.to_string(),
            weight,
            enabled,
        }
    }

    #[test]
    fn fixed_duration_requires_positive_seconds() {
        assert_eq!(resolve_duration(&fixed_timer(30)), Ok(30));
        assert!(resolve_duration(&fixed_timer(0)).is_err());
    }

    #[test]
    fn random_duration_stays_in_range() {
        for _ in 0..20 {
            let duration = resolve_duration(&random_timer(5, 8)).expect("duration");

            assert!((5..=8).contains(&duration));
        }
    }

    #[test]
    fn random_duration_rejects_invalid_ranges() {
        assert!(resolve_duration(&random_timer(10, 4)).is_err());
    }

    #[test]
    fn disabled_timer_cannot_resolve() {
        let mut timer = fixed_timer(10);
        timer.enabled = false;

        assert!(resolve_duration(&timer).is_err());
    }

    #[test]
    fn option_pick_ignores_disabled_and_zero_weight_options() {
        let options = vec![
            option("a", 0, true),
            option("b", 3, false),
            option("c", 1, true),
        ];
        let picked = pick_option(&options).expect("picked option");

        assert_eq!(picked.option_id, "c");
        assert_eq!(picked.option_index, 2);
    }

    #[test]
    fn option_pick_rejects_empty_eligible_options() {
        let options = vec![option("a", 0, true), option("b", 1, false)];

        assert!(pick_option(&options).is_err());
    }

    #[test]
    fn option_pick_uses_weight_boundaries() {
        let options = vec![option("a", 2, true), option("b", 3, true)];
        let eligible_options: Vec<(usize, &SelectionOption)> = options.iter().enumerate().collect();

        let first = pick_option_with_target(&eligible_options, 1).expect("first option");
        let second = pick_option_with_target(&eligible_options, 2).expect("second option");

        assert_eq!(first.option_id, "a");
        assert_eq!(second.option_id, "b");
    }

    #[test]
    fn option_pick_uses_default_label_for_blank_options() {
        let options = vec![SelectionOption {
            id: "blank".to_string(),
            label: " ".to_string(),
            weight: 1,
            enabled: true,
        }];
        let eligible_options: Vec<(usize, &SelectionOption)> = options.iter().enumerate().collect();

        let picked = pick_option_with_target(&eligible_options, 0).expect("picked option");

        assert_eq!(picked.label, "Option");
    }
}
