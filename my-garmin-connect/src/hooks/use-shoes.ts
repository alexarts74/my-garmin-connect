import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as SQLite from 'expo-sqlite';
import {
  getShoeDB,
  getAllShoes,
  getShoeForActivity,
  getShoesStats,
  insertShoe,
  updateShoe,
  deleteShoe,
  linkActivityToShoe,
  unlinkActivity,
} from '@/lib/shoe-storage';
import type { SoleType } from '@/types/shoes';

function useShoeDB() {
  const dbRef = useRef<SQLite.SQLiteDatabase | null>(null);

  useEffect(() => {
    getShoeDB().then((db) => {
      dbRef.current = db;
    });
  }, []);

  const getDB = useCallback(async () => {
    if (dbRef.current) return dbRef.current;
    const db = await getShoeDB();
    dbRef.current = db;
    return db;
  }, []);

  return getDB;
}

export function useShoes() {
  const getDB = useShoeDB();

  return useQuery({
    queryKey: ['shoes'],
    queryFn: async () => {
      const db = await getDB();
      return getAllShoes(db);
    },
  });
}

export function useShoesStats() {
  const getDB = useShoeDB();

  return useQuery({
    queryKey: ['shoes', 'stats'],
    queryFn: async () => {
      const db = await getDB();
      return getShoesStats(db);
    },
  });
}

export function useShoeForActivity(activityId: number | undefined) {
  const getDB = useShoeDB();

  return useQuery({
    queryKey: ['shoes', 'activity', activityId],
    queryFn: async () => {
      const db = await getDB();
      return getShoeForActivity(db, activityId!);
    },
    enabled: activityId != null,
  });
}

export function useShoeActions() {
  const getDB = useShoeDB();
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['shoes'] });
  }, [queryClient]);

  const addShoe = useMutation({
    mutationFn: async (shoe: { id: string; name: string; brand: string; soleType: SoleType }) => {
      const db = await getDB();
      await insertShoe(db, shoe);
    },
    onSuccess: invalidate,
  });

  const editShoe = useMutation({
    mutationFn: async (shoe: { id: string; name: string; brand: string; soleType: SoleType; retired: boolean }) => {
      const db = await getDB();
      await updateShoe(db, shoe);
    },
    onSuccess: invalidate,
  });

  const removeShoe = useMutation({
    mutationFn: async (id: string) => {
      const db = await getDB();
      await deleteShoe(db, id);
    },
    onSuccess: invalidate,
  });

  const linkShoe = useMutation({
    mutationFn: async (params: { activityId: number; shoeId: string; distanceMeters: number }) => {
      const db = await getDB();
      await linkActivityToShoe(db, params.activityId, params.shoeId, params.distanceMeters);
    },
    onSuccess: invalidate,
  });

  const unlinkShoe = useMutation({
    mutationFn: async (activityId: number) => {
      const db = await getDB();
      await unlinkActivity(db, activityId);
    },
    onSuccess: invalidate,
  });

  return { addShoe, editShoe, removeShoe, linkShoe, unlinkShoe };
}
