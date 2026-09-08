package com.example.promptexpert.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.promptexpert.ui.theme.*
import kotlinx.coroutines.delay

val loadingAuditMessages = listOf(
    "Recopilando arquitectura y componentes...",
    "Contactando al arquitecto de software IA...",
    "Analizando la estructura de Jetpack Compose...",
    "Buscando posibles fugas y vulnerabilidades OWASP...",
    "Evaluando la experiencia de usuario (UX) y accesibilidad...",
    "Optimizando el rendimiento y consumo de memoria...",
    "Generando informe ejecutivo de auditoría...",
    "Pulido final del reporte..."
)

@Composable
fun AuditReportDialog(
    isOpen: Boolean,
    onClose: () -> Unit,
    isLoading: Boolean,
    report: String
) {
    if (!isOpen) return

    var currentMessageIndex by remember { mutableIntStateOf(0) }

    LaunchedEffect(isLoading) {
        if (isLoading) {
            currentMessageIndex = 0
            while (true) {
                delay(2200)
                currentMessageIndex = (currentMessageIndex + 1) % loadingAuditMessages.size
            }
        }
    }

    Dialog(
        onDismissRequest = onClose,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.94f)
                .fillMaxHeight(0.85f)
                .border(1.5.dp, AuraBorderAccent, RoundedCornerShape(24.dp)),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = AuraSurface)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Informe de Auditoría AURA",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    IconButton(onClick = onClose, modifier = Modifier.testTag("close_audit_dialog")) {
                        Icon(Icons.Default.Close, contentDescription = "Cerrar", tint = AuraSubtext)
                    }
                }

                HorizontalDivider(color = AuraBorder, modifier = Modifier.padding(vertical = 10.dp))

                if (isLoading) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(48.dp),
                                color = AuraPrimary,
                                strokeWidth = 3.5.dp
                            )
                            Spacer(modifier = Modifier.height(20.dp))
                            Text(
                                text = loadingAuditMessages[currentMessageIndex],
                                style = MaterialTheme.typography.bodyLarge,
                                fontWeight = FontWeight.SemiBold,
                                color = AuraText,
                                modifier = Modifier.padding(horizontal = 16.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Esto puede tomar unos segundos. Por favor, espera.",
                                style = MaterialTheme.typography.bodySmall,
                                color = AuraSubtext
                            )
                        }
                    }
                } else {
                    val scrollState = rememberScrollState()
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(scrollState)
                            .padding(top = 8.dp)
                    ) {
                        RenderSimpleMarkdown(report.ifBlank { "No se encontró ningún reporte generado." })
                    }
                }
            }
        }
    }
}
