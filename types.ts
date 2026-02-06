import React from 'react';

export interface Patient {
    id: string;
    name: string;
    avatar: string;
    therapyType: string;
    nextSession: string;
    status: 'Ativo' | 'Pendente' | 'Em Pausa';
    email: string;
}

export interface Appointment {
    id: string;
    time: string;
    patientName: string;
    type: string;
    mode: 'Online' | 'Presencial';
    status: 'Confirmada' | 'Aguardando';
}

export type View = 'dashboard' | 'patients' | 'agenda' | 'financial' | 'reports' | 'settings';

export interface StatCardProps {
    title: string;
    value: string;
    trend: string;
    trendUp: boolean;
    icon: React.ReactNode;
    colorClass: string;
}

export const IMAGES = {
    LOGO: "https://lh3.googleusercontent.com/aida-public/AB6AXuC-cPOclLqfTnIJ7gz4M8Uhx4o1apaYXA8GDv0Bk4P8z6r05tqDejjyxySa9zAlsIygN9EoOGKGMMEdFoYH-T5c9_8-ra7Mqta2HoKNKjz8KKgMIPvtEtIJzMEKwaG2ynUEyNHd_4nCdwi12WwPFBQsuQ-sTf9BFcKc6T6PkO0FgrXLD12DR41iLWstp_7TsQGVIpZm5f11_sM-hVdC3Kxy4XPPLV1cdM-XNZt1o6-QmtQRzd9p0gIxj_z6J4Tj7VqRGJuXehpLErU",
    USER_AVATAR: "https://lh3.googleusercontent.com/aida-public/AB6AXuDSgJxYKkG2DYOCn1Dvn-MggOJB77-8701eC_Sz-9IKh9ruELESHCr0n6jlbDNzCAFdXkmRpBhGybekCEEdx4dkzLcP3XCB5TixXHl_5OsYE-8b52YN3n8EHzzsN9FkpAZUMaTn9ZzpSIEzc7tFO_HxXjxsGFjDLJsy4KgbVK-UgeYmFmXPmKtKX9blkWWKCOresMFIHsvH-_BBSeF36D1V12agmKGbb1KQ8dU1Qh3Vv_YCcM2rgjuh6_5ncK90XZskkaKEiWs_J_U",
    PATIENT_1: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwyLNKqY6rjjY_fKUYHj-x9UI8s-DAalc0JXOjbTR4IO3TNOeVXpeO9heviRORR5AUuS7j2XDjUnfSSyAFkfJHRXGqTrMQPft3ThXpM6nvIlxGi6L1ef-ROjhJZaRZYTZfbBi63LZIopFaAPGZ0hUemAhuDzi9PYfVSwXi8_nXpanpaYlbjZqRlySckHP_zU7OLva3gSjDuny6zo0ofBNIgJR_07VPqxMI7AKbijC-K3aEtIiWPlKC7-5o7xYUpDqKrUNjh1RYxRs",
    PATIENT_2: "https://lh3.googleusercontent.com/aida-public/AB6AXuDpsqhq5v_-j-ZuHOyG9gvd--e068W6Owv7hYquz3zL12tQW4V_9vGus9_8X1Nd4pg-N5DBDyUMZfyW0NS_fjFlxzET7uoX-VFLdwKVq-3zZaBp_ukbONc_un2T-aPEn6f4kdPoaY4V2lmlDZQunw8NCMckNWSs6N58AjUwz_Wr-XPoSczdjXTqciY7KyTWmbIPwHd_xyCknYonTo3APvNFb5XCTpler0Od8b8w2HyXDgdxZdTKw2WWOd00MKDzWoqVpiaWpvOiluw",
    PATIENT_3: "https://lh3.googleusercontent.com/aida-public/AB6AXuAy4oAOJnndtpGo6hTzZ-OyBdyGicptB0qjFyi5LH41bSpQ-EA945zmcxnFwwwBlwYbK2zNuWFe1QGMBGduOxOB0fzIXbX7vg9DPa9T1U1eUjkO4YyfzuR09Wfvu8GGJiNeKLgtzlzrKQbpv39qriNg5-pNZb4I9HtBnRfxKFS5hEA6XDZStFkl9LtJV5xpR2tcTbUlqXVTEtJrQoBspm7D0Sc_EOJFk7pvZTeDXrTlOBJyiKrk_lCdnVRq26KwsOfFi_owRHLAQp4",
};