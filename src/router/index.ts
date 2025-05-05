import { createRouter, createWebHistory } from 'vue-router';
import App from '../App.vue';


import staffMembers from '../components/staffMembers_.vue';


import archiveBoxes from '../components/archiveBoxes.vue';
import fileTypes from '../components/fileTypes.vue';
import paperFiles from '../components/paperFiles.vue';



import maintenanceContracts from '../components/maintenanceContracts.vue';
import contactPersons from '../components/contactPersons.vue';
import paymentAmounts from '../components/paymentAmounts.vue';



import elevatorLimitSpeedTests from '../components/elevatorLimitSpeedTests_.vue';
import instrumentManagement from '../components/instrumentManagement.vue';

import elevatorInspections from '../components/elevatorInspections_.vue';

import networkAccounts from '../components/network-accounts_.vue';
import checkRecords from '../components/checkRecords.vue';


import maintenanceRecords from '../components/maintenanceRecords_.vue';
import elevatorInfo_ from '../components/elevatorInfo_.vue';
import Departments_ from '../components/Departments_.vue';
import DocumentRecord2 from '../components/DocumentRecord_.vue';
import FileDistribution_ from '../components/FileDistribution_.vue';
import PositionManagement from '../components/PositionManagement_.vue';

import FileArchiving_ from '../components/FileArchiving_.vue';

const routes = [


    {
        path: '/FileArchiving_',
        component: FileArchiving_
    },

    {
        path: '/FileDistribution_',
        component: FileDistribution_
    },
    {
        path: '/Employee',
        component: staffMembers
    },

    {
        path: '/Departments',
        component: Departments_
    },
    {
        path: '/DocumentRecord2',
        component: DocumentRecord2
    },
    {
        path: '/checkRecords',
        component: checkRecords
    },

    {
        path: '/networkAccounts',
        component: networkAccounts
    },
    {
        path: '/elevatorInspections',
        component: elevatorInspections
    },
    {
        path: '/instrumentManagement',
        component: instrumentManagement
    },

    {
        path: '/elevatorLimitSpeedTests',
        component: elevatorLimitSpeedTests
    },


    {
        path: '/maintenanceRecords',
        component: maintenanceRecords
    },
    
    {
        path: '/elevatorInfo_',
        component: elevatorInfo_
    },
    {
        path: '/paymentAmounts',
        component: paymentAmounts
    },
    
    {
        path: '/contactPersons',
        component: contactPersons
    },
    {
        path: '/maintenanceContracts',
        component: maintenanceContracts
    },






    
    {
        path: '/paperFiles',
        component: paperFiles
    },
    
    {
        path: '/fileTypes',
        component: fileTypes
    },
    {
        path: '/',
        component: App
    },
    {
        path: '/archiveBoxes',
        component: archiveBoxes
    },

  
   
    {
        path: '/position',
        component: PositionManagement
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;    