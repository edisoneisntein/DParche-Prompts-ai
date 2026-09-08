package com.example.promptexpert.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.promptexpert.data.model.AugmentationType
import com.example.promptexpert.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun PromptAugmentersSection(
    basePrompt: String,
    augmentations: Map<AugmentationType, String>,
    loadingAugmenters: Set<AugmentationType>,
    onAugment: (AugmentationType) -> Unit,
    modifier: Modifier = Modifier
) {
    if (basePrompt.isBlank()) return

    Card(
        modifier = modifier
            .fillMaxWidth()
            .border(1.dp, AuraBorder, RoundedCornerShape(24.dp)),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = AuraSurface)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                text = "4. Potenciadores de Prompt",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = AuraText
            )
            Text(
                text = "Refina tu prompt con transformaciones expertas de un solo clic.",
                style = MaterialTheme.typography.bodySmall,
                color = AuraSubtext,
                modifier = Modifier.padding(top = 2.dp, bottom = 16.dp)
            )

            // 4 Grid buttons
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                AugmentationType.entries.forEach { augType ->
                    val isRunning = loadingAugmenters.contains(augType)
                    val result = augmentations[augType]

                    AugmenterCard(
                        augType = augType,
                        result = result,
                        isLoading = isRunning,
                        onClick = { onAugment(augType) }
                    )
                }
            }
        }
    }
}

@Composable
private fun AugmenterCard(
    augType: AugmentationType,
    result: String?,
    isLoading: Boolean,
    onClick: () -> Unit
) {
    val clipboardManager = LocalClipboardManager.current
    val coroutineScope = rememberCoroutineScope()
    var isCopied by remember { mutableStateOf(false) }

    val icon = when (augType) {
        AugmentationType.CRITICAL_PERSPECTIVE -> Icons.Default.Psychology
        AugmentationType.CREATIVE_ANALOGY -> Icons.Default.Lightbulb
        AugmentationType.UNEXPECTED_ROLE -> Icons.Default.AutoAwesome
        AugmentationType.LOOP_REFINEMENT -> Icons.Default.Sync
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, AuraBorder, RoundedCornerShape(16.dp)),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = AuraSurfaceVariant)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(AuraPrimary.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(imageVector = icon, contentDescription = null, tint = AuraPrimary, modifier = Modifier.size(20.dp))
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = augType.title,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = AuraText
                        )
                        Text(
                            text = augType.description,
                            style = MaterialTheme.typography.bodySmall,
                            color = AuraSubtext,
                            fontSize = 11.sp
                        )
                    }
                }

                Button(
                    onClick = onClick,
                    enabled = !isLoading,
                    modifier = Modifier
                        .height(36.dp)
                        .testTag("apply_aug_${augType.id}"),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AuraPrimaryVariant),
                    contentPadding = PaddingValues(horizontal = 12.dp)
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                    } else {
                        Text("Aplicar", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                    }
                }
            }

            // Expanded Result Box if already augmented
            if (!result.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(12.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(AuraBackground.copy(alpha = 0.8f))
                        .border(1.dp, AuraBorderAccent, RoundedCornerShape(12.dp))
                        .padding(12.dp)
                ) {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Resultado Potenciado:",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = AuraTertiary
                            )
                            IconButton(
                                onClick = {
                                    clipboardManager.setText(AnnotatedString(result))
                                    isCopied = true
                                    coroutineScope.launch {
                                        delay(2000)
                                        isCopied = false
                                    }
                                },
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(
                                    imageVector = if (isCopied) Icons.Default.Check else Icons.Default.ContentCopy,
                                    contentDescription = "Copiar",
                                    tint = if (isCopied) AuraEmerald else AuraText,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        RenderSimpleMarkdown(result)
                    }
                }
            }
        }
    }
}
