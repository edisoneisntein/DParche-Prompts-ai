package com.example.promptexpert.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.promptexpert.data.database.AppDatabase
import com.example.promptexpert.data.database.ChatMessageEntity
import com.example.promptexpert.data.model.AugmentationType
import com.example.promptexpert.data.model.ExpertMode
import com.example.promptexpert.data.model.UploadedDocument
import com.example.promptexpert.data.repository.PromptRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class MainUiState(
    val idea: String = "",
    val expertMode: ExpertMode = ExpertMode.GENERAL,
    val documents: List<UploadedDocument> = emptyList(),
    val generatedPrompt: String = "",
    val isGenerating: Boolean = false,
    val isCached: Boolean = false,
    val cacheCount: Int = 0,
    val augmentations: Map<AugmentationType, String> = emptyMap(),
    val loadingAugmenters: Set<AugmentationType> = emptySet(),
    val chainedPrompt: String = "",
    val isChaining: Boolean = false,
    val isAuditOpen: Boolean = false,
    val isAuditing: Boolean = false,
    val auditReport: String = "",
    val isVoiceChatOpen: Boolean = false,
    val isVoiceThinking: Boolean = false,
    val errorMessage: String? = null
)

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val database = AppDatabase.getInstance(application)
    private val repository = PromptRepository(
        cacheDao = database.promptCacheDao(),
        chatDao = database.chatMessageDao()
    )

    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    val chatMessages: StateFlow<List<ChatMessageEntity>> = repository.chatHistory
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    init {
        viewModelScope.launch {
            repository.cacheCount.collect { count ->
                _uiState.update { it.copy(cacheCount = count) }
            }
        }
    }

    fun onIdeaChange(newIdea: String) {
        _uiState.update {
            it.copy(
                idea = newIdea,
                errorMessage = null
            )
        }
    }

    fun onModeSelect(mode: ExpertMode) {
        _uiState.update { it.copy(expertMode = mode) }
    }

    fun addDocument(doc: UploadedDocument) {
        _uiState.update { it.copy(documents = it.documents + doc) }
    }

    fun removeDocument(doc: UploadedDocument) {
        _uiState.update { it.copy(documents = it.documents - doc) }
    }

    fun clearDocuments() {
        _uiState.update { it.copy(documents = emptyList()) }
    }

    fun generatePrompt() {
        val state = _uiState.value
        val idea = state.idea.trim()
        if (idea.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Por favor, ingresa una idea para comenzar.") }
            return
        }

        viewModelScope.launch {
            // Check cache first
            val cachedResult = repository.getCachedPrompt(idea, state.expertMode.id, state.documents)
            if (cachedResult != null) {
                _uiState.update {
                    it.copy(
                        generatedPrompt = cachedResult,
                        isCached = true,
                        isGenerating = false,
                        errorMessage = null
                    )
                }
                return@launch
            }

            _uiState.update {
                it.copy(
                    generatedPrompt = "",
                    isGenerating = true,
                    isCached = false,
                    augmentations = emptyMap(),
                    chainedPrompt = "",
                    errorMessage = null
                )
            }

            try {
                repository.generatePromptStream(idea, state.expertMode, state.documents)
                    .catch { err ->
                        _uiState.update {
                            it.copy(
                                isGenerating = false,
                                errorMessage = "Error al generar prompt: ${err.message}"
                            )
                        }
                    }
                    .collect { chunk ->
                        _uiState.update {
                            it.copy(generatedPrompt = it.generatedPrompt + chunk)
                        }
                    }
            } finally {
                _uiState.update { it.copy(isGenerating = false) }
            }
        }
    }

    fun applyAugmentation(type: AugmentationType) {
        val base = _uiState.value.generatedPrompt
        if (base.isBlank()) return

        viewModelScope.launch {
            _uiState.update {
                it.copy(loadingAugmenters = it.loadingAugmenters + type)
            }

            try {
                repository.augmentPromptStream(base, type)
                    .collect { result ->
                        _uiState.update {
                            it.copy(
                                augmentations = it.augmentations + (type to result),
                                loadingAugmenters = it.loadingAugmenters - type
                            )
                        }
                    }
            } catch (_: Exception) {
                _uiState.update {
                    it.copy(loadingAugmenters = it.loadingAugmenters - type)
                }
            }
        }
    }

    fun generateChainedPrompt(prevPrompt: String, aiResponse: String, nextGoal: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isChaining = true, chainedPrompt = "") }
            try {
                repository.chainPromptStream(prevPrompt, aiResponse, nextGoal)
                    .collect { result ->
                        _uiState.update { it.copy(chainedPrompt = result) }
                    }
            } finally {
                _uiState.update { it.copy(isChaining = false) }
            }
        }
    }

    fun clearCache() {
        viewModelScope.launch {
            repository.clearCache()
            _uiState.update { it.copy(isCached = false) }
        }
    }

    fun sendVoiceMessage(message: String) {
        if (message.isBlank()) return
        viewModelScope.launch {
            repository.saveChatMessage("user", message)
            _uiState.update { it.copy(isVoiceThinking = true) }

            try {
                // Generate reply using the selected mode
                val reply = StringBuilder()
                repository.generatePromptStream(message, _uiState.value.expertMode, emptyList())
                    .collect { chunk ->
                        reply.append(chunk)
                    }

                val fullReply = reply.toString()
                if (fullReply.isNotBlank()) {
                    repository.saveChatMessage("assistant", fullReply)
                }
            } catch (e: Exception) {
                repository.saveChatMessage("assistant", "Lo siento, ocurrió un error al procesar tu solicitud: ${e.message}")
            } finally {
                _uiState.update { it.copy(isVoiceThinking = false) }
            }
        }
    }

    fun clearVoiceHistory() {
        viewModelScope.launch {
            repository.clearChatHistory()
        }
    }

    fun runAudit() {
        viewModelScope.launch {
            _uiState.update { it.copy(isAuditOpen = true, isAuditing = true, auditReport = "") }
            val summary = """
                App: Prompt Expert VIP (Android Jetpack Compose)
                Arch: MVVM + Clean Architecture + Room Database + Gemini API
                Features: Prompt Generation, Multi-turn Chaining, Augmentations, Voice Chat, Local Caching
                Security: API Key injection via BuildConfig & Secrets Gradle Plugin, Zero broad permissions
            """.trimIndent()

            val report = repository.auditApplication(summary)
            _uiState.update { it.copy(isAuditing = false, auditReport = report) }
        }
    }

    fun setAuditOpen(isOpen: Boolean) {
        _uiState.update { it.copy(isAuditOpen = isOpen) }
    }

    fun setVoiceChatOpen(isOpen: Boolean) {
        _uiState.update { it.copy(isVoiceChatOpen = isOpen) }
    }

    fun dismissError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    fun injectPromptToMain(promptText: String) {
        _uiState.update {
            it.copy(
                generatedPrompt = promptText,
                isCached = false
            )
        }
    }
}
