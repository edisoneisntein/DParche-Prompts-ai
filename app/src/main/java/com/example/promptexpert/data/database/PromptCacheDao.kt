package com.example.promptexpert.data.database

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface PromptCacheDao {
    @Query("SELECT * FROM prompt_cache WHERE cacheKey = :key LIMIT 1")
    suspend fun getByKey(key: String): PromptCacheEntity?

    @Query("SELECT COUNT(*) FROM prompt_cache")
    fun getCacheCount(): Flow<Int>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCache(entity: PromptCacheEntity)

    @Query("DELETE FROM prompt_cache")
    suspend fun clearAll()
}
