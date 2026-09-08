package com.example.promptexpert.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.promptexpert.ui.components.*
import com.example.promptexpert.ui.theme.*

@Composable
fun MainPromptScreen(
    viewModel: MainViewModel = viewModel(),
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val chatMessages by viewModel.chatMessages.collectAsStateWithLifecycle()

    Scaffold(
        modifier = modifier
            .fillMaxSize()
            .background(AuraBackground),
        containerColor = AuraBackground,
        floatingActionButton = {
            FloatingActionButton(
                onClick = { viewModel.setVoiceChatOpen(true) },
                shape = RoundedCornerShape(20.dp),
                containerColor = AuraPrimary,
                contentColor = Color.White,
                modifier = Modifier
                    .testTag("floating_voice_chat_fab")
                    .padding(bottom = 12.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(contentAlignment = Alignment.TopEnd) {
                        Icon(
                            imageVector = Icons.Default.Mic,
                            contentDescription = "Abrir Chat de Voz AURA",
                            modifier = Modifier.size(24.dp)
                        )
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(AuraEmerald)
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Voz IA",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp),
            contentPadding = PaddingValues(top = 12.dp, bottom = 80.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header
            item {
                Header(
                    onOpenVoiceChat = { viewModel.setVoiceChatOpen(true) },
                    onOpenAudit = { viewModel.runAudit() }
                )
            }

            // Error Banner
            if (uiState.errorMessage != null) {
                item {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, AuraRose, RoundedCornerShape(16.dp)),
                        colors = CardDefaults.cardColors(containerColor = AuraRose.copy(alpha = 0.15f)),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(Icons.Default.Warning, contentDescription = null, tint = AuraRose)
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    text = uiState.errorMessage ?: "",
                                    color = Color.White,
                                    fontSize = 13.sp
                                )
                            }
                            IconButton(
                                onClick = { viewModel.dismissError() },
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(Icons.Default.Close, contentDescription = "Cerrar error", tint = AuraSubtext)
                            }
                        }
                    }
                }
            }

            // Step 1: Input Field
            item {
                PromptInputField(
                    value = uiState.idea,
                    onValueChange = { viewModel.onIdeaChange(it) },
                    onSubmit = { viewModel.generatePrompt() },
                    isLoading = uiState.isGenerating
                )
            }

            // Document Support Section
            item {
                DocumentUploadSection(
                    documents = uiState.documents,
                    onAddDocument = { viewModel.addDocument(it) },
                    onRemoveDocument = { viewModel.removeDocument(it) },
                    onClearAll = { viewModel.clearDocuments() },
                    isLoading = uiState.isGenerating
                )
            }

            // Step 2: Expert Mode Selector
            item {
                ExpertModeSelector(
                    selectedMode = uiState.expertMode,
                    onModeSelect = { viewModel.onModeSelect(it) },
                    isLoading = uiState.isGenerating
                )
            }

            // Example Chips
            item {
                ExampleChips(
                    onSelect = { example ->
                        viewModel.onIdeaChange(example.prompt)
                        viewModel.onModeSelect(example.mode)
                        viewModel.generatePrompt()
                    },
                    isLoading = uiState.isGenerating
                )
            }

            // Step 3: Prompt Output Card
            item {
                PromptOutputCard(
                    prompt = uiState.generatedPrompt,
                    isLoading = uiState.isGenerating,
                    isCached = uiState.isCached
                )
            }

            // Step 4: Augmenters Section
            item {
                PromptAugmentersSection(
                    basePrompt = uiState.generatedPrompt,
                    augmentations = uiState.augmentations,
                    loadingAugmenters = uiState.loadingAugmenters,
                    onAugment = { viewModel.applyAugmentation(it) }
                )
            }

            // Step 5: Prompt Chainer Section
            item {
                PromptChainerSection(
                    lastGeneratedPrompt = uiState.generatedPrompt,
                    chainedResult = uiState.chainedPrompt,
                    isLoading = uiState.isChaining,
                    onGenerateChained = { prevPrompt, aiResponse, nextGoal ->
                        viewModel.generateChainedPrompt(prevPrompt, aiResponse, nextGoal)
                    }
                )
            }

            // Footer
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Diseño inspirado en AURA OS · Creado con la API de Gemini",
                        style = MaterialTheme.typography.bodySmall,
                        color = AuraSubtext,
                        fontSize = 12.sp
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (uiState.cacheCount > 0) {
                            OutlinedButton(
                                onClick = { viewModel.clearCache() },
                                shape = RoundedCornerShape(18.dp),
                                border = ButtonDefaults.outlinedButtonBorder.copy(
                                    brush = Brush.horizontalGradient(listOf(AuraRose.copy(alpha = 0.5f), AuraRose))
                                ),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = AuraRose),
                                modifier = Modifier.testTag("clear_cache_footer_button")
                            ) {
                                Text("Limpiar Caché (${uiState.cacheCount})", fontSize = 12.sp)
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                        }

                        Button(
                            onClick = { viewModel.runAudit() },
                            shape = RoundedCornerShape(18.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = AuraSurfaceGlow),
                            modifier = Modifier.testTag("audit_app_footer_button")
                        ) {
                            Text("Auditar Aplicación", fontSize = 12.sp, color = AuraText)
                        }
                    }
                }
            }
        }

        // Voice Chat Bottom Sheet
        VoiceChatBottomSheet(
            isOpen = uiState.isVoiceChatOpen,
            onClose = { viewModel.setVoiceChatOpen(false) },
            messages = chatMessages,
            isThinking = uiState.isVoiceThinking,
            currentMode = uiState.expertMode,
            onModeChange = { viewModel.onModeSelect(it) },
            onSendMessage = { viewModel.sendVoiceMessage(it) },
            onClearHistory = { viewModel.clearVoiceHistory() },
            onInjectPromptToMain = { viewModel.injectPromptToMain(it) }
        )

        // Audit Dialog
        AuditReportDialog(
            isOpen = uiState.isAuditOpen,
            onClose = { viewModel.setAuditOpen(false) },
            isLoading = uiState.isAuditing,
            report = uiState.auditReport
        )
    }
}
