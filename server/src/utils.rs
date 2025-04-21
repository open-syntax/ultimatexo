use anyhow::{Context, Result};

pub fn parse_tuple(s: &str) -> Result<(usize, usize)> {
    let (a, b) = s
        .trim()
        .split_once(',')
        .context("Failed to split the input (expected a ',')")?;
    Ok((
        a.parse().context("Failed to parse first number")?,
        b.parse().context("Failed to parse second number")?,
    ))
}
