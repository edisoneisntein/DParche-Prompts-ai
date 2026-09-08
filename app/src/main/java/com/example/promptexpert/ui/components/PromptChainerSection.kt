package com.example.promptexpert.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Link
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
import com.example.promptexpert.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun PromptChainerSection(
    lastGeneratedPrompt: String,
    chainedResult: String,
    isLoading: Boolean,
    onGenerateChained: (prevPrompt: String, aiResponse: String, nextGoal: String) -> Unit,
    modifier: Modifier = Modifier
) {
    var prevPrompt by remember { mutableStateOf("") }
    var aiResponse by remember { mutableStateOf("") }
    var nextGoal by remember { mutableStateOf("") }

    val clipboardManager = LocalClipboardManager.current
    val coroutineScope = rememberCoroutineScope()
    var isCopied by remember { mutableStateOf(false) }

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
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.Link, contentDescription = null, tint = AuraSecondary)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Encadenador de Continuidad (Prompt Chaining)",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = AuraText
                    )
                }
            }

            Text(
                text = "Diseña el siguiente prompt experto basado en la respuesta que te dio la IA en el turno anterior.",
                style = MaterialTheme.typography.bodySmall,
                color = AuraSubtext,
                modifier = Modifier.padding(top = 4.dp, bottom = 14.dp)
            )

            // Input 1: Previous prompt
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = "1. Prompt anterior ejecutado:", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold, color = AuraText)
                if (lastGeneratedPrompt.isNotBlank()) {
                    TextButton(
                        onClick = { prevPrompt = lastGeneratedPrompt },
                        contentPadding = PaddingValues(0.dp)
                    ) {
                        Text("Usar último prompt", fontSize = 11.sp, color = AuraPrimary)
                    }
                }
            }
            OutlinedTextField(
                value = prevPrompt,
                onValueChange = { prevPrompt = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 70.dp, max = 120.dp)
                    .testTag("chainer_prev_prompt"),
                placeholder = { Text("Pega el prompt que enviaste a la IA...", color = AuraSubtext.copy(alpha = 0.6f), fontSize = 12.sp) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = AuraPrimary,
                    unfocusedBorderColor = AuraBorder,
                    focusedTextColor = AuraText,
                    unfocusedTextColor = AuraText
                ),
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Input 2: AI response
            Text(text = "2. Respuesta obtenida del modelo:", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold, color = AuraText)
            OutlinedTextField(
                value = aiResponse,
                onValueChange = { aiResponse = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 70.dp, max = 120.dp)
                    .testTag("chainer_ai_response"),
                placeholder = { Text("Pega la respuesta generada por la IA que deseas refinar o continuar...", color = AuraSubtext.copy(alpha = 0.6f), fontSize = 12.sp) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = AuraPrimary,
                    unfocusedBorderColor = AuraBorder,
                    focusedTextColor = AuraText,
                    unfocusedTextColor = AuraText
                ),
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Input 3: Next goal
            Text(text = "3. Siguiente paso o corrección deseada:", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold, color = AuraText)
            OutlinedTextField(
                value = nextGoal,
                onValueChange = { nextGoal = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 70.dp, max = 120.dp)
                    .testTag("chainer_next_goal"),
                placeholder = { Text("Ej. 'Agrega pruebas unitarias', 'Refactoriza con coroutines'...", color = AuraSubtext.copy(alpha = 0.6f), fontSize = 12.sp) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = AuraPrimary,
                    unfocusedBorderColor = AuraBorder,
                    focusedTextColor = AuraText,
                    unfocusedTextColor = AuraText
                ),
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(14.dp))

            Button(
                onClick = { onGenerateChained(prevPrompt, aiResponse, nextGoal) },
                enabled = (prevPrompt.isNotBlank() || nextGoal.isNotBlank()) && !isLoading,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(46.dp)
                    .testTag("chainer_submit_button"),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AuraSecondary)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                } else {
                    Text("Generar Siguiente Prompt Experto", fontWeight = FontWeight.Bold, color = Color.White)
                }
            }

            // Chained result display
            if (chainedResult.isNotBlank()) {
                Spacer(modifier = Modifier.height(16.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(AuraBackground)
                        .border(1.dp, AuraBorderAccent, RoundedCornerShape(14.dp))
                        .padding(14.dp)
                ) {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Prompt de Continuidad Resultante:",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = AuraTertiary
                            )
                            IconButton(
                                onClick = {
                                    clipboardManager.setText(AnnotatedString(chainedResult))
                                    isCopied = true
                                    coroutineScope.launch {
                                        delay(2000)
                                        isCopied = false
                                    }
                                }
                            ) {
                                Icon(
                                    imageVector = if (isCopied) Icons.Default.Check else Icons.Default.ContentCopy,
                                    contentDescription = "Copiar",
                                    tint = if (isCopied) AuraEmerald else AuraText,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        RenderSimpleMarkdown(chainedResult)
                    }
                }
            }
        }
    }
}
