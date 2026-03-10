import api from './api';

/**
 * Export Asnaf data to JSON
 */
export const exportAsnafBackup = async () => {
    try {
        const response = await api.get('/backup/asnaf', {
            responseType: 'blob'
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `backup_asnaf_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();

        return { success: true };
    } catch (error) {
        console.error('Export Asnaf error:', error);
        throw error;
    }
};

/**
 * Import Asnaf data from JSON
 */
export const importAsnafBackup = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/restore/asnaf', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

/**
 * Export SDM data to JSON
 */
export const exportSDMBackup = async () => {
    try {
        const response = await api.get('/backup/sdm', {
            responseType: 'blob'
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `backup_sdm_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();

        return { success: true };
    } catch (error) {
        console.error('Export SDM error:', error);
        throw error;
    }
};

/**
 * Import SDM data from JSON
 */
export const importSDMBackup = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/restore/sdm', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};
