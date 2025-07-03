function transformData() {
    try {
        const inputPaths = {
            data1: path.join(__dirname, '../../data', 'aislamientos.csv'),
            data2: path.join(__dirname, '../../data', 'pipelinedata.csv'),
            data3: path.join(__dirname, '../../data', 'test_of_lazos_updated.csv'),
        };
        const outputPath = path.join(__dirname, '../../data', 'summarysubsytems.csv');

        console.log('Reading datasets...');
        const data1 = parseCSV(fs.readFileSync(inputPaths.data1, 'utf8')).data;
        const data2 = parseCSV(fs.readFileSync(inputPaths.data2, 'utf8')).data;
        const data3 = parseCSV(fs.readFileSync(inputPaths.data3, 'utf8')).data;

        const subsystemMap = {};

        // --- Process DATA_1 ---
        data1.forEach(row => {
            const subsystem = row.SUBSYSTEM;
            if (!subsystem) return;
            if (!subsystemMap[subsystem]) subsystemMap[subsystem] = { SUBSYSTEM: subsystem };

            subsystemMap[subsystem].TOTAL_ITEMS = (subsystemMap[subsystem].TOTAL_ITEMS || 0) + 1;

            const done = ['Avance Distanciadores', 'Avance Aislamiento', 'Avance Chapa', 'Avance Cajas', 'Avance Rematar']
                .every(key => row[key] === '1');

            if (done) subsystemMap[subsystem].DONEITEM = (subsystemMap[subsystem].DONEITEM || 0) + 1;

            const pending = ['Avance Distanciadores', 'Avance Aislamiento', 'Avance Chapa', 'Avance Cajas', 'Avance Rematar']
                .some(key => !row[key] || row[key].trim() === '');

            if (pending) subsystemMap[subsystem].PENDINITEM = (subsystemMap[subsystem].PENDINITEM || 0) + 1;
        });

        // --- Process DATA_2 ---
        const progressMap = {};
        const progressCount = {};
        data2.forEach(row => {
            const subsystem = row['SUBSYSTEM'];
            if (!subsystem || !row['CONSTRUC COORD PROGRESS']) return;

            const value = parseFloat(row['CONSTRUC COORD PROGRESS']);
            if (isNaN(value)) return;

            progressMap[subsystem] = (progressMap[subsystem] || 0) + value;
            progressCount[subsystem] = (progressCount[subsystem] || 0) + 1;
        });

        Object.keys(progressMap).forEach(subsystem => {
            if (!subsystemMap[subsystem]) subsystemMap[subsystem] = { SUBSYSTEM: subsystem };
            subsystemMap[subsystem].PROGRESS = (progressMap[subsystem] / progressCount[subsystem]).toFixed(2);
        });

        // --- Process DATA_3 ---
        data3.forEach(row => {
            const subsystem = row.SUBSYSTEM;
            if (!subsystem) return;
            if (!subsystemMap[subsystem]) subsystemMap[subsystem] = { SUBSYSTEM: subsystem };

            subsystemMap[subsystem].TOTAL_LOOPS = (subsystemMap[subsystem].TOTAL_LOOPS || 0) + 1;

            const okValue = row['OK=100%'];
            if (okValue === '100.00%') {
                subsystemMap[subsystem].DONELOOPS = (subsystemMap[subsystem].DONELOOPS || 0) + 1;
            } else {
                subsystemMap[subsystem].PENDINGLOOPS = (subsystemMap[subsystem].PENDINGLOOPS || 0) + 1;
            }
        });

        // --- Convert and save ---
        const result = Object.values(subsystemMap).sort((a, b) => a.SUBSYSTEM.localeCompare(b.SUBSYSTEM));
        const headers = ['SUBSYSTEM', 'TOTAL_ITEMS', 'DONEITEM', 'PENDINITEM', 'PROGRESS', 'TOTAL_LOOPS', 'DONELOOPS', 'PENDINGLOOPS'];
        const csvOutput = [
            headers.join(','),
            ...result.map(row => headers.map(h => row[h] ?? '').join(','))
        ].join('\n');

        fs.writeFileSync(outputPath, csvOutput);
        console.log('Combined data saved to:', outputPath);

    } catch (error) {
        console.error('Error processing combined data:', error);
        throw error;
    }
}
