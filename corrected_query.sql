WITH s1 AS (
    SELECT 
        iso_insulation AS iso_insulation,
        MAX(subsystem) AS subsystem, 
        SUM(mleq_insulation)::FLOAT AS mleq,
        SUM(m2eq_insulation)::FLOAT AS m2eq,
        SUM(total_m_avance_insulation)::FLOAT AS total_m_advance
    FROM master_subsystem
    WHERE iso_insulation IS NOT NULL
    GROUP BY iso_insulation
    ORDER BY iso_insulation
),

s2 AS (
    SELECT 
        isometricos_ifc3_isos as isometricos_isos,
        hito_isos,
        teiga_reinstatement_isos,
        teiga_insulation_isos,
        siemsa_isos,
        ten_isos
    FROM master_subsystem
    WHERE isometricos_ifc3_isos IS NOT NULL
    ORDER BY isometricos_ifc3_isos
),

s3 AS ( 
    SELECT 
        isometric_fc,
        includes_fc
    FROM master_subsystem
    WHERE isometric_fc IS NOT NULL
    ORDER BY isometric_fc
)

SELECT 
    s1.iso_insulation AS 'ISOMETRIC',
    s1.subsystem AS 'SUBSYSTEM', 
    s1.mleq AS 'MLEQ',
    s1.m2eq AS 'M2EQ',
    s1.total_m_advance AS 'TOTAL M ADVANCE',
    s2.hito_isos AS 'HITO',
    s2.teiga_reinstatement_isos AS 'TEIGA REINSTATEMENT',
    s2.teiga_insulation_isos AS 'TEIGA INSULATION',
    s2.siemsa_isos AS 'SIEMSA',
    s2.ten_isos AS 'TEN',
    s3.includes_fc AS 'TPs'
FROM s1 
LEFT JOIN s2 ON s1.iso_insulation = s2.isometricos_isos
LEFT JOIN s3 ON s1.iso_insulation = s3.isometric_fc;