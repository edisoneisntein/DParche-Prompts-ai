package com.example.promptexpert.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.VideoFile
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.promptexpert.data.model.UploadedDocument
import com.example.promptexpert.ui.theme.*

@Composable
fun DocumentUploadSection(
    documents: List<UploadedDocument>,
    onAddDocument: (UploadedDocument) -> Unit,
    onRemoveDocument: (UploadedDocument) -> Unit,
    onClearAll: () -> Unit,
    isLoading: Boolean,
    modifier: Modifier = Modifier
) {
    var showAddDialog by remember { mutableStateOf(false) }
    var docName by remember { mutableStateOf("") }
    var docContent by remember { mutableStateOf("") }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .border(1.dp, AuraBorder, RoundedCornerShape(20.dp)),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = AuraSurfaceVariant)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Description,
                        contentDescription = null,
                        tint = AuraTertiary,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Documentos de soporte",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = AuraText
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "(Opcional)",
                        style = MaterialTheme.typography.labelMedium,
                        color = AuraSubtext
                    )
                }

                if (documents.isNotEmpty()) {
                    TextButton(
                        onClick = onClearAll,
                        enabled = !isLoading,
                        contentPadding = PaddingValues(horizontal = 8.dp)
                    ) {
                        Text("Limpiar todo", color = AuraRose, fontSize = 12.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (documents.isEmpty()) {
                OutlinedButton(
                    onClick = { showAddDialog = true },
                    enabled = !isLoading,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("add_document_button"),
                    shape = RoundedCornerShape(12.dp),
                    border = ButtonDefaults.outlinedButtonBorder.copy(
                        brush = androidx.compose.ui.graphics.SolidColor(AuraBorder)
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = null,
                        tint = AuraPrimary,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Adjuntar texto, código o especificación de soporte",
                        color = AuraText,
                        fontSize = 13.sp
                    )
                }
            } else {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(documents) { doc ->
                        AssistChip(
                            onClick = { },
                            label = {
                                Column {
                                    Text(
                                        text = doc.name,
                                        fontWeight = FontWeight.Medium,
                                        fontSize = 12.sp,
                                        color = AuraText
                                    )
                                    Text(
                                        text = doc.formattedSize,
                                        fontSize = 10.sp,
                                        color = AuraSubtext
                                    )
                                }
                            },
                            leadingIcon = {
                                Icon(
                                    imageVector = if (doc.isMedia) Icons.Default.VideoFile else Icons.Default.Description,
                                    contentDescription = null,
                                    tint = AuraPrimary,
                                    modifier = Modifier.size(16.dp)
                                )
                            },
                            trailingIcon = {
                                IconButton(
                                    onClick = { onRemoveDocument(doc) },
                                    modifier = Modifier.size(18.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Close,
                                        contentDescription = "Eliminar documento",
                                        tint = AuraSubtext,
                                        modifier = Modifier.size(14.dp)
                                    )
                                }
                            },
                            colors = AssistChipDefaults.assistChipColors(
                                containerColor = AuraBackground
                            ),
                            border = AssistChipDefaults.assistChipBorder(borderColor = AuraBorder)
                        )
                    }

                    item {
                        IconButton(
                            onClick = { showAddDialog = true },
                            enabled = !isLoading,
                            modifier = Modifier
                                .size(40.dp)
                                .background(AuraBackground, RoundedCornerShape(10.dp))
                                .border(1.dp, AuraBorder, RoundedCornerShape(10.dp))
                        ) {
                            Icon(
                                imageVector = Icons.Default.Add,
                                contentDescription = "Añadir otro documento",
                                tint = AuraPrimary
                            )
                        }
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("Adjuntar Documento o Código", color = AuraText) },
            text = {
                Column {
                    OutlinedTextField(
                        value = docName,
                        onValueChange = { docName = it },
                        label = { Text("Nombre del archivo (ej. architecture.md, schema.sql)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = AuraPrimary,
                            unfocusedBorderColor = AuraBorder,
                            focusedTextColor = AuraText,
                            unfocusedTextColor = AuraText
                        )
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = docContent,
                        onValueChange = { docContent = it },
                        label = { Text("Contenido / Código fuente") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(180.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = AuraPrimary,
                            unfocusedBorderColor = AuraBorder,
                            focusedTextColor = AuraText,
                            unfocusedTextColor = AuraText
                        )
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val name = docName.ifBlank { "document_${documents.size + 1}.txt" }
                        val content = docContent.trim()
                        if (content.isNotBlank()) {
                            onAddDocument(
                                UploadedDocument(
                                    name = name,
                                    content = content,
                                    size = content.toByteArray().size.toLong(),
                                    type = "text/plain"
                                )
                            )
                        }
                        docName = ""
                        docContent = ""
                        showAddDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AuraPrimary)
                ) {
                    Text("Adjuntar", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddDialog = false }) {
                    Text("Cancelar", color = AuraSubtext)
                }
            },
            containerColor = AuraSurface,
            shape = RoundedCornerShape(20.dp)
        )
    }
}
