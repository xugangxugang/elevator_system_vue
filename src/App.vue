<template>
  <el-container>
    <el-aside width="200px">
      <el-menu default-active="1" class="el-menu-vertical-demo" @open="handleOpen" @close="handleClose" router>
        <!-- 电梯管理模块 -->
        <el-sub-menu index="elevator">
          <template #title>
            <span>电梯管理</span>
          </template>
          <el-menu-item index="/elevatorInspections">年检管理</el-menu-item>
          <el-menu-item index="/elevatorLimitSpeedTests">限速器管理</el-menu-item>
          <el-menu-item index="/elevatorInfo_">电梯基本信息表</el-menu-item>


     
        </el-sub-menu>

        <!-- 维保管理模块 -->
        <el-sub-menu index="maintenance">
          <template #title>
            <span>维保管理</span>
          </template>
          <el-menu-item index="/networkAccounts">使用单位网络账号管理</el-menu-item>
          <el-menu-item index="/maintenanceRecords">维保台账表</el-menu-item>
          <el-menu-item index="/">维保情况登记</el-menu-item>
          
          <el-menu-item index="/maintenanceContracts">维保合同表</el-menu-item>
          <el-menu-item index="/paymentAmounts">收款金额表</el-menu-item>
        </el-sub-menu>

        <!-- 职员管理模块 -->
        <el-sub-menu index="company">
          <template #title>
            <span>公司管理</span>
          </template>
          <el-menu-item index="/instrumentManagement">公司仪器仪表管理</el-menu-item>
          <el-menu-item index="/contactPersons">使用单位联系人</el-menu-item>
          <el-menu-item index="/Departments">部门</el-menu-item>
          <el-menu-item index="/position">职位</el-menu-item>
          <el-menu-item index="/Employee">职员</el-menu-item>
        </el-sub-menu>

        <!-- 档案管理模块 -->
        <el-sub-menu index="archive">
          <template #title>
            <span>档案管理</span>
          </template>
          <el-menu-item index="/FileDistribution_">公司_文件发放控制清单</el-menu-item>
          <el-menu-item index="/DocumentRecord2">公司_文件发放回收登记表</el-menu-item>

          <el-menu-item index="/FileArchiving_">公司_文件归档登记表</el-menu-item>
          
          
          <el-menu-item index="/checkRecords">档案盒检查</el-menu-item>
          <el-menu-item index="/archiveBoxes">档案盒</el-menu-item>
          <el-menu-item index="/fileTypes">文件类型</el-menu-item>

        </el-sub-menu>

        <!-- 管理资料生成区模块 -->
        <el-sub-menu index="documentGeneration">
          <template #title>
            <span>每个月报表生成</span>
          </template>

          <el-menu-item index="/">维保报情况</el-menu-item>
          <el-menu-item index="/selfInspectionReport">自检报告生成</el-menu-item>
          <el-menu-item index="/basicInformationForm">基本情况表生成</el-menu-item>
        </el-sub-menu>
      </el-menu>

    </el-aside>
    <el-container>
      <el-header>
        <h1>{{ resourceName }} 管理系统</h1>
      </el-header>
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const resourceName = ref('公司_部门表');
const router = useRouter();

const handleOpen = (key: string | number, keyPath: (string | number)[]) => {
  console.log(key, keyPath);
};

const handleClose = (key: string | number, keyPath: (string | number)[]) => {
  console.log(key, keyPath);
};
</script>

<style scoped>
.el-header {
  background-color: #B3C0D1;
  color: #333;
  line-height: 60px;
  padding: 0 20px;
}

.el-aside {
  color: #333;
}
</style>