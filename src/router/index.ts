import { createRouter, createWebHistory } from 'vue-router';
import App from '../App.vue';



import MaintenanceStatistics from '../components/MaintenanceStatistics.vue';

// 引入组件
import staffMembers from '../components/staffMembers_.vue';
import archiveBoxes from '../components/archiveBoxes.vue';
import elevatorLimitSpeedTests from '../components/elevatorLimitSpeedTests_.vue';
import elevatorInspections from '../components/elevatorInspections_.vue';
import networkAccounts from '../components/network-accounts_.vue';
import maintenanceRecords from '../components/maintenanceRecords_.vue';
import elevatorInfo_ from '../components/elevatorInfo_.vue';
import Departments_ from '../components/Departments_.vue';
import DocumentRecord2 from '../components/DocumentRecord_.vue';
import FileDistribution_ from '../components/FileDistribution_.vue';
import PositionManagement from '../components/PositionManagement_.vue';
import FileArchiving_ from '../components/FileArchiving_.vue';

import Equipment_Maintenance_Order_ from "../components/Equipment_Maintenance_Order_.vue";
import EquipmentMaintenanceOrder_view from "../components/EquipmentMaintenanceOrder_view.vue";

// 路由配置
const routes = [
    // 基础路由
    {
        path: '/EquipmentMaintenanceOrder_view',
        component: EquipmentMaintenanceOrder_view
    },
    // 基础路由
    {
        path: '/EquipmentMaintenanceOrder',
        component: Equipment_Maintenance_Order_
    },

    // 基础路由
    {
        path: '/',
        component: App
    },

    // 组件路由
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
        path: '/networkAccounts',
        component: networkAccounts
    },
    {
        path: '/elevatorInspections',
        component: elevatorInspections
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
        path: '/archiveBoxes',
        component: archiveBoxes
    },
    {
        path: '/position',
        component: PositionManagement
    },
    {
        path: '/FileDistribution_',
        component: FileDistribution_
    },
    {
        path: '/FileArchiving_',
        component: FileArchiving_
    },
    {
        path: '/maintenanceStatistics',
        name: 'MaintenanceStatistics',
        component: MaintenanceStatistics,
        meta: { title: '维保台账统计' }
    }
];

// 创建路由实例
const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;