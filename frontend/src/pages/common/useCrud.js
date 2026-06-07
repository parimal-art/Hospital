import { useCallback, useEffect, useState } from 'react';
import api from '../../api/axiosInstance.js';

export default function useCrud(endpoint) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await api.get(endpoint, { params: { search, ...params } });
      setRows(data.data || []);
    } finally { setLoading(false); }
  }, [endpoint, search]);

  useEffect(() => { const t = setTimeout(() => load(), 300); return () => clearTimeout(t); }, [load]);

  const create = async (payload) => { setSaving(true); try { await api.post(endpoint, payload); await load(); } finally { setSaving(false); } };
  const update = async (id, payload) => { setSaving(true); try { await api.put(`${endpoint}/${id}`, payload); await load(); } finally { setSaving(false); } };
  const remove = async (id) => { await api.delete(`${endpoint}/${id}`); await load(); };
  return { rows, setRows, loading, saving, search, setSearch, load, create, update, remove };
}
