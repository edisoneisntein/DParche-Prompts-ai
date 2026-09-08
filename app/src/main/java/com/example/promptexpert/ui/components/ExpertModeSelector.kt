package com.example.promptexpert.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.promptexpert.data.model.ExpertMode
import com.example.promptexpert.ui.theme.*

@Composable
fun ExpertModeSelector(
    selectedMode: ExpertMode,
    onModeSelect: (ExpertMode) -> Unit,
    isLoading: Boolean,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .border(1.dp, AuraBorder, RoundedCornerShape(24.dp)),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = AuraSurface)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "2. Selecciona un Modo Experto",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = AuraText
                )
                Spacer(modifier = Modifier.width(8.dp))
                Badge(
                    containerColor = AuraPrimaryVariant,
                    contentColor = Color.White
                ) {
                    Text(
                        text = "8 Modos",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                ExpertMode.selectableModes.forEach { mode ->
                    val isSelected = mode == selectedMode
                    ModeCard(
                        mode = mode,
                        isSelected = isSelected,
                        onClick = { if (!isLoading) onModeSelect(mode) },
                        enabled = !isLoading
                    )
                }
            }
        }
    }
}

@Composable
private fun ModeCard(
    mode: ExpertMode,
    isSelected: Boolean,
    onClick: () -> Unit,
    enabled: Boolean
) {
    val borderModifier = if (isSelected) {
        Modifier.border(
            width = 1.5.dp,
            brush = Brush.horizontalGradient(listOf(AuraPrimary, AuraSecondary)),
            shape = RoundedCornerShape(16.dp)
        )
    } else {
        Modifier.border(
            width = 1.dp,
            color = AuraBorder,
            shape = RoundedCornerShape(16.dp)
        )
    }

    val backgroundModifier = if (isSelected) {
        Modifier.background(
            brush = Brush.horizontalGradient(
                listOf(AuraPrimary.copy(alpha = 0.15f), AuraSecondary.copy(alpha = 0.10f))
            )
        )
    } else {
        Modifier.background(AuraSurfaceVariant.copy(alpha = 0.6f))
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .then(borderModifier)
            .then(backgroundModifier)
            .clickable(enabled = enabled, onClick = onClick)
            .padding(14.dp)
            .testTag("mode_card_${mode.id}")
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            val icon = when (mode) {
                ExpertMode.ADVERSARIAL_ARCHITECT, ExpertMode.AUDITOR_ELITE -> Icons.Default.Security
                ExpertMode.ARCHITECT_V3, ExpertMode.LOOP_ENGINEER -> Icons.Default.Sync
                ExpertMode.GENERAL -> Icons.Default.Psychology
                else -> Icons.Default.AutoAwesome
            }

            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(if (isSelected) AuraPrimary else AuraSurfaceGlow),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = if (isSelected) Color.White else AuraSubtext,
                    modifier = Modifier.size(22.dp)
                )
            }

            Spacer(modifier = Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = mode.title,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = if (isSelected) Color.White else AuraText
                    )
                    if (mode.isElite) {
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "ELITE",
                            fontSize = 9.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = AuraAmber,
                            modifier = Modifier
                                .background(AuraAmber.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                .padding(horizontal = 4.dp, vertical = 1.dp)
                        )
                    }
                }
                Text(
                    text = mode.subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = AuraSubtext,
                    fontSize = 12.sp,
                    lineHeight = 16.sp
                )
            }

            RadioButton(
                selected = isSelected,
                onClick = onClick,
                enabled = enabled,
                colors = RadioButtonDefaults.colors(
                    selectedColor = AuraPrimary,
                    unselectedColor = AuraSubtext
                )
            )
        }
    }
}
