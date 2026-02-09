import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PdfData {
    patientName: string;
    data: any;
    isBlank?: boolean;
    psychologistName?: string;
    crp?: string;
}

export const generateAnamnesisPDF = ({ patientName, data, isBlank = false, psychologistName, crp }: PdfData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const dateStr = format(new Date(), "dd/MM/yyyy", { locale: ptBR });

    // --- Brand Header ---
    // Emerald Background Header
    doc.setFillColor(16, 185, 129); // primary-500
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('PsicoFlow', 20, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Prontuário de Anamnese Psicológica', 20, 28);

    if (psychologistName) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`${psychologistName.toUpperCase()}${crp ? ` - CRP: ${crp}` : ''}`, 20, 35);
    }

    doc.setFontSize(10);
    doc.text(`Data: ${dateStr}`, pageWidth - 20, 25, { align: 'right' });
    if (!isBlank) {
        doc.text(`Paciente: ${patientName}`, pageWidth - 20, 33, { align: 'right' });
    }

    let currentY = 50;

    const sections = [
        { id: 'identificacao', title: '1. IDENTIFICAÇÃO' },
        { id: 'queixa', title: '2. QUEIXA PRINCIPAL' },
        { id: 'historia_problema', title: '3. HISTÓRIA DO PROBLEMA' },
        { id: 'historico_psi', title: '4. HISTÓRICO PSIQUIÁTRICO/PSI' },
        { id: 'historico_medico', title: '5. HISTÓRICO MÉDICO' },
        { id: 'substancias', title: '6. USO DE SUBSTÂNCIAS' },
        { id: 'familiar', title: '7. HISTÓRICO FAMILIAR' },
        { id: 'vida_desenvolvimento', title: '8. VIDA E DESENVOLVIMENTO' },
        { id: 'funcionamento_atual', title: '9. FUNCIONAMENTO ATUAL' },
        { id: 'observacoes', title: '10. OBSERVAÇÕES CLÍNICAS' },
        { id: 'objetivos', title: '11. OBJETIVOS TERAPÊUTICOS' },
    ];

    const fieldLabels: any = {
        identificacao: ['Nome Completo', 'Data de Nascimento', 'Idade', 'Estado Civil', 'Profissão / Ocupação', 'Escolaridade', 'Cidade / Residência', 'Telefone', 'E-mail'],
        queixa: ['Motivo da procura', 'Descrição (palavras do paciente)', 'Duração do problema', 'Motivação atual para busca', 'Expectativas'],
        historia_problema: ['Início dos sintomas', 'Evento(s) desencadeante(s)', 'Frequência', 'Intensidade', 'Agravantes', 'Aliviantes', 'Impactos'],
        historico_psi: ['Psicoterapia anterior?', 'Tipo de acompanhamento', 'Avaliação da experiência', 'Histórico psiquiátrico', 'Medicação atual', 'Medicação passada', 'Internações'],
        historico_medico: ['Doenças crônicas', 'Condições médica', 'Cirurgias', 'Medicação contínua', 'Sono', 'Alimentação', 'Atividade física'],
        substancias: ['Álcool (freq/qtd)', 'Cigarro/Vape', 'Outras substâncias', 'Automedicação'],
        familiar: ['Com quem mora', 'Relação com pais', 'Relação com irmãos', 'Relação afetiva', 'Transtornos na família', 'Eventos significativos'],
        vida_desenvolvimento: ['Infância', 'Adolescência', 'Experiências marcantes', 'Traumas'],
        funcionamento_atual: ['Humor', 'Ansiedade', 'Energia', 'Motivação', 'Relações sociais', 'Trabalho/Estudo', 'Rotina'],
        observacoes: ['Verbal', 'Não verbal', 'Coerência', 'Afeto', 'Insight', 'Postura'],
        objetivos: ['Demandas', 'Curto prazo', 'Médio prazo', 'Observações finais']
    };

    const fieldKeys: any = {
        identificacao: ['nome', 'nascimento', 'idade', 'estado_civil', 'profissao', 'escolaridade', 'cidade', 'telefone', 'email'],
        queixa: ['motivo', 'descricao', 'duracao', 'motivacao_atual', 'expectativas'],
        historia_problema: ['inicio', 'eventos', 'frequencia', 'intensidade', 'agravantes', 'aliviantes', 'impacto'],
        historico_psi: ['anterior', 'tipo_anterior', 'avaliacao_anterior', 'psiquiatrico', 'medicacao_atual', 'medicacao_passada', 'internacoes'],
        historico_medico: ['cronicas', 'relevantes', 'cirurgias', 'medicamentos_continuos', 'sono', 'alimentacao', 'exercicio'],
        substancias: ['alcool', 'cigarro', 'outras', 'sem_prescricao'],
        familiar: ['mora_com', 'pais', 'irmaos', 'conjugal', 'transtornos_familia', 'eventos_familia'],
        vida_desenvolvimento: ['infancia', 'adolescencia', 'marcantes', 'traumas'],
        funcionamento_atual: ['humor', 'ansiedade', 'energia', 'motivacao', 'sociais', 'trabalho', 'rotina'],
        observacoes: ['verbal', 'nao_verbal', 'coerencia', 'afeto', 'insight', 'postura'],
        objetivos: ['demandas', 'curto_prazo', 'medio_prazo', 'alinhamento']
    };

    sections.forEach((section) => {
        // Check space for section title
        if (currentY > 250) {
            doc.addPage();
            currentY = 20;
        }

        // Section Header with background
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(15, currentY - 5, pageWidth - 30, 8, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text(section.title, 20, currentY);
        currentY += 8;

        const labels = fieldLabels[section.id];
        const keys = fieldKeys[section.id];

        labels.forEach((label: string, index: number) => {
            const key = keys[index];
            let val = isBlank ? '' : data?.[section.id]?.[key] || '';

            // Force patient name in first field if not blank
            if (!isBlank && section.id === 'identificacao' && key === 'nome' && !val) {
                val = patientName;
            }

            // Check for page break before drawing label/box
            if (currentY > 270) {
                doc.addPage();
                currentY = 20;
            }

            // Label
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139); // slate-500
            doc.text(label, 20, currentY);
            currentY += 4;

            // Data box or line
            doc.setDrawColor(226, 232, 240); // slate-200
            doc.setFillColor(255, 255, 255);

            const boxHeight = val.length > 80 || val.includes('\n') ? 15 : 8;
            doc.rect(20, currentY, pageWidth - 40, boxHeight);

            if (val) {
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(30, 41, 59);
                const splitText = doc.splitTextToSize(val, pageWidth - 45);
                doc.text(splitText, 22, currentY + 5);
            } else {
                // If blank, maybe add some dotted lines or just leave the box
                doc.setDrawColor(241, 245, 249); // slate-100
                doc.line(22, currentY + 6, pageWidth - 22, currentY + 6);
            }

            currentY += boxHeight + 4;
        });

        currentY += 6; // Space between sections
    });

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
            `Página ${i} de ${totalPages} - Gerado via PsicoFlow`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    const nameForFile = isBlank ? 'em_Branco' : patientName.replace(/\s+/g, '_');
    doc.save(`Anamnese_${nameForFile}.pdf`);
};

export const generateAttendancePDF = ({
    patientName,
    sessions,
    psychologistName,
    crp,
    startDate,
    endDate
}: {
    patientName: string;
    sessions: any[];
    psychologistName?: string;
    crp?: string;
    startDate: string;
    endDate: string;
}) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const dateStr = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    // --- Header ---
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('PsicoFlow', 20, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Atestado de Comparecimento', 20, 28);

    if (psychologistName) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`${psychologistName.toUpperCase()}${crp ? ` - CRP: ${crp}` : ''}`, 20, 35);
    }

    let currentY = 60;

    // --- Content ---
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('ATESTADO DE COMPARECIMENTO', pageWidth / 2, currentY, { align: 'center' });

    currentY += 20;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const introText = `Atesto para os devidos fins que o(a) Sr(a). ${patientName.toUpperCase()}, compareceu em nosso consultório para sessões de psicoterapia no período entre ${format(new Date(startDate), 'dd/MM/yyyy')} e ${format(new Date(endDate), 'dd/MM/yyyy')}, conforme as datas e horários relacionados abaixo:`;

    const splitIntro = doc.splitTextToSize(introText, pageWidth - 40);
    doc.text(splitIntro, 20, currentY);

    currentY += (splitIntro.length * 7) + 10;

    // --- Sessions Table ---
    const rows = sessions.map(s => [
        format(new Date(s.date), 'dd/MM/yyyy'),
        format(new Date(s.date), 'HH:mm'),
        s.type === 'online' ? 'Sessão Online' : 'Sessão Presencial'
    ]);

    autoTable(doc, {
        startY: currentY,
        head: [['Data', 'Horário', 'Tipo de Atendimento']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 3 },
        margin: { left: 20, right: 20 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 30;

    // --- Footer/Signature ---
    if (currentY > 250) {
        doc.addPage();
        currentY = 50;
    }

    doc.setFontSize(11);
    doc.text(`${dateStr}.`, 20, currentY);

    currentY += 30;

    doc.setDrawColor(30, 41, 59);
    doc.line(pageWidth / 4, currentY, (pageWidth / 4) * 3, currentY);
    currentY += 7;

    doc.setFont('helvetica', 'bold');
    doc.text(psychologistName || 'Psicólogo(a)', pageWidth / 2, currentY, { align: 'center' });
    if (crp) {
        currentY += 5;
        doc.setFont('helvetica', 'normal');
        doc.text(`CRP: ${crp}`, pageWidth / 2, currentY, { align: 'center' });
    }

    doc.save(`Atestado_${patientName.replace(/\s+/g, '_')}.pdf`);
};

export const generateDischargePDF = ({
    patientName,
    summary,
    evolution,
    reason,
    referrals,
    psychologistName,
    crp
}: {
    patientName: string;
    summary: string;
    evolution: string;
    reason: string;
    referrals?: string;
    psychologistName?: string;
    crp?: string;
}) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const dateStr = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    // --- Branding Header ---
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('PsicoFlow', 20, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Relatório de Alta Terapêutica', 20, 28);
    if (psychologistName) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`${psychologistName.toUpperCase()}${crp ? ` - CRP: ${crp}` : ''}`, 20, 35);
    }

    let currentY = 60;
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO DE ALTA', pageWidth / 2, currentY, { align: 'center' });
    currentY += 20;

    const renderSection = (title: string, content: string) => {
        if (!content) return;
        if (currentY > 250) { doc.addPage(); currentY = 30; }
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129);
        doc.text(title.toUpperCase(), 20, currentY);
        currentY += 7;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const splitText = doc.splitTextToSize(content, pageWidth - 40);
        doc.text(splitText, 20, currentY);
        currentY += (splitText.length * 6) + 12;
    };

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(`Paciente: ${patientName.toUpperCase()}`, 20, currentY);
    currentY += 15;

    renderSection('Resumo do Processo', summary);
    renderSection('Evolução Observada', evolution);
    renderSection('Motivo da Alta', reason);
    if (referrals) renderSection('Encaminhamentos e Orientações', referrals);

    // Signature Area
    if (currentY > 230) { doc.addPage(); currentY = 50; }
    currentY += 20;
    doc.text(`${dateStr}.`, 20, currentY);
    currentY += 30;
    doc.setDrawColor(30, 41, 59);
    doc.line(pageWidth / 4, currentY, (pageWidth / 4) * 3, currentY);
    currentY += 7;
    doc.setFont('helvetica', 'bold');
    doc.text(psychologistName || 'Psicólogo(a)', pageWidth / 2, currentY, { align: 'center' });
    if (crp) {
        currentY += 5;
        doc.setFont('helvetica', 'normal');
        doc.text(`CRP: ${crp}`, pageWidth / 2, currentY, { align: 'center' });
    }

    doc.save(`Alta_${patientName.replace(/\s+/g, '_')}.pdf`);
};

export const generatePsychologicalReportPDF = ({
    patientName,
    purpose,
    demand,
    procedure,
    analysis,
    conclusion,
    psychologistName,
    crp
}: {
    patientName: string;
    purpose: string;
    demand: string;
    procedure: string;
    analysis: string;
    conclusion: string;
    psychologistName?: string;
    crp?: string;
}) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const dateStr = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    // --- Branding Header ---
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('PsicoFlow', 20, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Laudo Psicológico', 20, 28);
    if (psychologistName) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`${psychologistName.toUpperCase()}${crp ? ` - CRP: ${crp}` : ''}`, 20, 35);
    }

    let currentY = 60;
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('LAUDO PSICOLÓGICO', pageWidth / 2, currentY, { align: 'center' });
    currentY += 20;

    const renderSection = (title: string, content: string) => {
        if (currentY > 250) { doc.addPage(); currentY = 30; }
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129);
        doc.text(title.toUpperCase(), 20, currentY);
        currentY += 7;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const splitText = doc.splitTextToSize(content, pageWidth - 40);
        doc.text(splitText, 20, currentY);
        currentY += (splitText.length * 6) + 12;
    };

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`1. IDENTIFICAÇÃO`, 20, currentY);
    currentY += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`INTERESSADO: ${patientName.toUpperCase()}`, 20, currentY);
    currentY += 7;
    doc.text(`AUTORA: ${psychologistName?.toUpperCase() || ''} (CRP: ${crp || ''})`, 20, currentY);
    currentY += 15;

    renderSection('2. FINALIDADE', purpose);
    renderSection('3. DESCRIÇÃO DA DEMANDA', demand);
    renderSection('4. PROCEDIMENTO', procedure);
    renderSection('5. ANÁLISE', analysis);
    renderSection('6. CONCLUSÃO', conclusion);

    // Signature Area
    if (currentY > 230) { doc.addPage(); currentY = 50; }
    currentY += 20;
    doc.text(`${dateStr}.`, 20, currentY);
    currentY += 30;
    doc.setDrawColor(30, 41, 59);
    doc.line(pageWidth / 4, currentY, (pageWidth / 4) * 3, currentY);
    currentY += 7;
    doc.setFont('helvetica', 'bold');
    doc.text(psychologistName || 'Psicólogo(a)', pageWidth / 2, currentY, { align: 'center' });
    if (crp) {
        currentY += 5;
        doc.setFont('helvetica', 'normal');
        doc.text(`CRP: ${crp}`, pageWidth / 2, currentY, { align: 'center' });
    }

    doc.save(`Laudo_${patientName.replace(/\s+/g, '_')}.pdf`);
};

export const generateWeeklyProgressPDF = ({
    patientName,
    weekGoals,
    observations,
    nextSteps,
    psychologistName,
    crp
}: {
    patientName: string;
    weekGoals: string;
    observations: string;
    nextSteps: string;
    psychologistName?: string;
    crp?: string;
}) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const dateStr = format(new Date(), "dd/MM/yyyy", { locale: ptBR });

    // --- Branding Header ---
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('PsicoFlow', 20, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Acompanhamento de Progresso Semanal', 20, 28);
    if (psychologistName) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`${psychologistName.toUpperCase()}${crp ? ` - CRP: ${crp}` : ''}`, 20, 35);
    }

    let currentY = 60;
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('PROGRESSO SEMANAL', pageWidth / 2, currentY, { align: 'center' });
    currentY += 20;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`PACIENTE: ${patientName.toUpperCase()}`, 20, currentY);
    doc.text(`DATA: ${dateStr}`, pageWidth - 20, currentY, { align: 'right' });
    currentY += 15;

    const renderBox = (title: string, content: string) => {
        if (currentY > 250) { doc.addPage(); currentY = 30; }
        doc.setFontSize(10);
        doc.setTextColor(16, 185, 129);
        doc.text(title.toUpperCase(), 20, currentY);
        currentY += 5;

        const splitText = doc.splitTextToSize(content, pageWidth - 50);
        const boxHeight = (splitText.length * 6) + 10;

        doc.setDrawColor(226, 232, 240);
        doc.rect(20, currentY, pageWidth - 40, boxHeight);

        doc.setTextColor(51, 65, 85);
        doc.setFont('helvetica', 'normal');
        doc.text(splitText, 25, currentY + 7);

        currentY += boxHeight + 15;
    };

    renderBox('Objetivos da Semana', weekGoals);
    renderBox('Observações / Progresso', observations);
    renderBox('Planejamento / Próximos Passos', nextSteps);

    doc.save(`Progresso_${patientName.replace(/\s+/g, '_')}_${dateStr.replace(/\//g, '-')}.pdf`);
};
