package com.example.promptexpert.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = AuraPrimary,
    onPrimary = Color.White,
    primaryContainer = AuraSurfaceVariant,
    onPrimaryContainer = AuraText,
    secondary = AuraSecondary,
    onSecondary = Color.White,
    secondaryContainer = AuraSurfaceGlow,
    onSecondaryContainer = AuraText,
    tertiary = AuraTertiary,
    background = AuraBackground,
    onBackground = AuraText,
    surface = AuraSurface,
    onSurface = AuraText,
    surfaceVariant = AuraSurfaceVariant,
    onSurfaceVariant = AuraSubtext,
    outline = AuraBorderAccent,
    error = AuraRose,
    onError = Color.White
)

@Composable
fun PromptExpertTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography,
        content = content
    )
}
