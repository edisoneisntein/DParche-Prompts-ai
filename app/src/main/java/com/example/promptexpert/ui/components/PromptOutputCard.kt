package com.example.promptexpert.ui.components

import android.content.Context
import android.content.Intent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.promptexpert.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun PromptOutputCard(
    prompt: String,
    isLoading: Boolean,
    isCached: Boolean,
    modifier: Modifier = Modifier
) {
    if (prompt.isEmpty() && !isLoading) return

    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current
    val coroutineScope = rememberCoroutineScope()
    var isCopied by remember { mutableStateOf(false) }
    var activeTab by remember { mutableStateOf("preview") } // "preview" or "raw"

    val charCount = prompt.length
    val wordCount = if (prompt.isBlank()) 0 else prompt.trim().split(Regex("\\s+")).size
    val estimatedTokens = (charCount / 4)

    Card(
        modifier = modifier
            .fillMaxWidth()
            .border(
                1.5.dp,
                Brush.horizontalGradient(listOf(AuraPrimary.copy(alpha = 0.6f), AuraSecondary.copy(alpha = 0.6f))),
                RoundedCornerShape(24.dp)
            ),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = AuraSurface)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            // Header Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "3. Prompt Experto Generado",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = AuraText
                    )
                    if (isCached) {
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "⚡ Caché",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = AuraEmerald,
                            modifier = Modifier
                                .background(AuraEmerald.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }

                if (prompt.isNotEmpty() && !isLoading) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(
                            onClick = {
                                clipboardManager.setText(AnnotatedString(prompt))
                                isCopied = true
                                coroutineScope.launch {
                                    delay(2000)
                                    isCopied = false
                                }
                            },
                            modifier = Modifier.testTag("copy_prompt_button")
                        ) {
                            Icon(
                                imageVector = if (isCopied) Icons.Default.Check else Icons.Default.ContentCopy,
                                contentDescription = "Copiar prompt",
                                tint = if (isCopied) AuraEmerald else AuraText,
                                modifier = Modifier.size(20.dp)
                            )
                        }

                        IconButton(
                            onClick = {
                                val sendIntent = Intent().apply {
                                    action = Intent.ACTION_SEND
                                    putExtra(Intent.EXTRA_TEXT, prompt)
                                    type = "text/plain"
                                }
                                val shareIntent = Intent.createChooser(sendIntent, "Compartir Prompt Experto")
                                context.startActivity(shareIntent)
                            },
                            modifier = Modifier.testTag("share_prompt_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.Share,
                                contentDescription = "Compartir prompt",
                                tint = AuraText,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Tab Switcher
            if (prompt.isNotEmpty()) {
                TabRow(
                    selectedTabIndex = if (activeTab == "preview") 0 else 1,
                    containerColor = AuraSurfaceVariant,
                    contentColor = AuraPrimary,
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .height(38.dp)
                ) {
                    Tab(
                        selected = activeTab == "preview",
                        onClick = { activeTab = "preview" },
                        text = { Text("Vista Formateada", fontSize = 12.sp, fontWeight = FontWeight.SemiBold) }
                    )
                    Tab(
                        selected = activeTab == "raw",
                        onClick = { activeTab = "raw" },
                        text = { Text("Texto Puro", fontSize = 12.sp, fontWeight = FontWeight.SemiBold) }
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))
            }

            // Body Content
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 140.dp, max = 450.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(AuraBackground.copy(alpha = 0.7f))
                    .border(1.dp, AuraBorder, RoundedCornerShape(16.dp))
                    .padding(16.dp)
            ) {
                if (isLoading && prompt.isEmpty()) {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        CircularProgressIndicator(color = AuraPrimary, modifier = Modifier.size(36.dp))
                        Spacer(modifier = Modifier.height(14.dp))
                        Text(
                            text = "AURA está sintetizando el prompt perfecto...",
                            style = MaterialTheme.typography.bodyMedium,
                            color = AuraText
                        )
                    }
                } else {
                    SelectionContainer {
                        val scrollState = rememberScrollState()
                        Column(modifier = Modifier.verticalScroll(scrollState)) {
                            if (activeTab == "preview") {
                                RenderSimpleMarkdown(prompt)
                            } else {
                                Text(
                                    text = prompt,
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 13.sp,
                                    lineHeight = 19.sp,
                                    color = AuraText
                                )
                            }
                        }
                    }
                }
            }

            // Metrics Row
            if (prompt.isNotEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    MetricBadge(label = "Caracteres", value = "$charCount", color = AuraPrimary)
                    MetricBadge(label = "Palabras", value = "$wordCount", color = AuraSecondary)
                    MetricBadge(label = "Tokens Estimados", value = "~$estimatedTokens", color = AuraTertiary)
                }
            }
        }
    }
}

@Composable
private fun MetricBadge(label: String, value: String, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(color)
        )
        Spacer(modifier = Modifier.width(6.dp))
        Text(
            text = "$label: ",
            style = MaterialTheme.typography.labelMedium,
            color = AuraSubtext
        )
        Text(
            text = value,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
            color = AuraText
        )
    }
}

@Composable
fun RenderSimpleMarkdown(content: String) {
    val lines = content.lines()
    var inCodeBlock = false
    val codeBuffer = StringBuilder()

    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        for (line in lines) {
            val trimmed = line.trim()
            if (trimmed.startsWith("```")) {
                if (inCodeBlock) {
                    // Render accumulated code
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFF0F172A))
                            .border(1.dp, AuraBorder, RoundedCornerShape(8.dp))
                            .padding(12.dp)
                    ) {
                        Text(
                            text = codeBuffer.toString().trimEnd(),
                            fontFamily = FontFamily.Monospace,
                            fontSize = 12.sp,
                            color = Color(0xFFE2E8F0)
                        )
                    }
                    codeBuffer.clear()
                    inCodeBlock = false
                } else {
                    inCodeBlock = true
                }
                continue
            }

            if (inCodeBlock) {
                codeBuffer.append(line).append("\n")
                continue
            }

            when {
                trimmed.startsWith("# ") -> {
                    Text(
                        text = trimmed.removePrefix("# "),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = AuraPrimary,
                        modifier = Modifier.padding(top = 10.dp, bottom = 4.dp)
                    )
                }
                trimmed.startsWith("## ") -> {
                    Text(
                        text = trimmed.removePrefix("## "),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = AuraSecondary,
                        modifier = Modifier.padding(top = 8.dp, bottom = 2.dp)
                    )
                }
                trimmed.startsWith("### ") -> {
                    Text(
                        text = trimmed.removePrefix("### "),
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = AuraTertiary,
                        modifier = Modifier.padding(top = 6.dp)
                    )
                }
                trimmed.startsWith("- ") || trimmed.startsWith("* ") -> {
                    Row(modifier = Modifier.padding(start = 8.dp)) {
                        Text(text = "• ", color = AuraPrimary, fontWeight = FontWeight.Bold)
                        Text(
                            text = trimmed.substring(2),
                            style = MaterialTheme.typography.bodyMedium,
                            color = AuraText
                        )
                    }
                }
                trimmed.isNotBlank() -> {
                    Text(
                        text = trimmed,
                        style = MaterialTheme.typography.bodyMedium,
                        color = AuraText,
                        lineHeight = 21.sp
                    )
                }
                else -> {
                    Spacer(modifier = Modifier.height(4.dp))
                }
            }
        }
    }
}
