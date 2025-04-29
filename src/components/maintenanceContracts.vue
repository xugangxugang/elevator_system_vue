<template>
  <div>
    <el-card>
      <template #header>
        <h1>{{ resourceName }} 管理</h1>
      </template>
      <el-row>
        <el-col :span="12">
          <el-input v-model="searchQuery" placeholder="搜索维保编号" @input="search" clearable />
        </el-col>
        <el-col :span="6">
          <el-button @click="exportData">导出数据</el-button>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="addItem">新增维保合同</el-button>
        </el-col>
      </el-row>
      <el-table :data="data" stripe>
        <el-table-column v-for="(column, index) in columns" :key="index" :prop="column.prop" :label="column.label" />
        <el-table-column label="操作">
          <template #default="scope">
            <el-button size="small" @click="editItem(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteItem(scope.row.ID)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 30]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalCount"
      />
    </el-card>
    <el-dialog v-model="dialogVisible" :title="dialogTitle">
      <el-form :model="formData" label-width="120px" :rules="rules" ref="formRef">
        <el-form-item label="维保编号" prop="维保编号">
          <el-input v-model="formData.维保编号" placeholder="请输入维保编号">
            <template #append>
              <el-button @click="generateContractNumber">自动生成</el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="使用单位" prop="使用单位">
          <el-input v-model="formData.使用单位" placeholder="请输入使用单位" />
        </el-form-item>
        <el-form-item label="维保开始时间" prop="维保开始时间">
          <el-date-picker v-model="formData.维保开始时间" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="维保结束时间" prop="维保结束时间">
          <el-date-picker v-model="formData.维保结束时间" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="维保金额" prop="维保金额">
          <el-input v-model="formData.维保金额" placeholder="请输入维保金额" />
        </el-form-item>
        <el-form-item label="签订时间" prop="签订时间">
          <el-date-picker v-model="formData.签订时间" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="维保类型" prop="维保类型">
          <el-input v-model="formData.维保类型" placeholder="请输入维保类型" />
        </el-form-item>
        <el-form-item label="结算方式" prop="结算方式">
          <el-input v-model="formData.结算方式" placeholder="请输入结算方式" />
        </el-form-item>
        <el-form-item label="备注" prop="备注">
          <el-input v-model="formData.备注" placeholder="请输入备注" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { ElForm } from 'element-plus';

// 定义接口
interface Resource {
  ID: string;
  '维保编号': string;
  '使用单位': string;
  '维保开始时间': string;
  '维保结束时间': string;
  '维保金额': string;
  '签订时间': string;
  '维保类型': string;
  '结算方式': string;
  '备注': string;
  '创建时间': string;
  [key: string]: string | undefined; // 添加索引签名
}

interface Column {
  prop: string;
  label: string;
}

const apiBaseUrl = 'http://localhost:3000';

const resource = ref('maintenanceContracts');
const resourceName = ref('维保合同表');

const columns = ref<Column[]>([
  { prop: 'ID', label: 'ID' },
  { prop: '维保编号', label: '维保编号' },
  { prop: '使用单位', label: '使用单位' },
  { prop: '维保开始时间', label: '维保开始时间' },
  { prop: '维保结束时间', label: '维保结束时间' },
  { prop: '维保金额', label: '维保金额' },
  { prop: '签订时间', label: '签订时间' },
  { prop: '维保类型', label: '维保类型' },
  { prop: '结算方式', label: '结算方式' },
  { prop: '备注', label: '备注' },
  { prop: '创建时间', label: '创建时间' }
]);
const data = ref<Resource[]>([]);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);
const dialogVisible = ref(false);
const formData = ref<Resource>({
  ID: '',
  '维保编号': '',
  '使用单位': '',
  '维保开始时间': '',
  '维保结束时间': '',
  '维保金额': '',
  '签订时间': '',
  '维保类型': '清包',
  '结算方式': '按年',
  '备注': '',
  '创建时间': ''
});
const dialogTitle = ref('');
const formRef = ref<InstanceType<typeof ElForm>>();

const rules = {
  '维保编号': [{ required: true, message: '维保编号不能为空', trigger: 'blur' }],
  '使用单位': [{ required: true, message: '使用单位不能为空', trigger: 'blur' }]
};

const fetchData = async () => {
  try {
    const response = await axios.get<Record<string, any>>(`${apiBaseUrl}/api/${resource.value}`, {
      params: {
        page: currentPage.value,
        limit: pageSize.value,
        q: searchQuery.value
      }
    });
    data.value = response.data.data as Resource[];
    totalCount.value = response.data.totalCount;
  } catch (error) {
    console.error('获取数据时出错:', error);
  }
};

const search = () => {
  currentPage.value = 1;
  fetchData();
};

const exportData = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/api/${resource.value}/export`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${resourceName.value}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('导出数据时出错:', error);
  }
};

const editItem = (item: Resource) => {
  formData.value = {
    ID: item.ID,
    '维保编号': item.维保编号,
    '使用单位': item.使用单位,
    '维保开始时间': item.维保开始时间,
    '维保结束时间': item.维保结束时间,
    '维保金额': item.维保金额,
    '签订时间': item.签订时间,
    '维保类型': item.维保类型,
    '结算方式': item.结算方式,
    '备注': item.备注 || '',
    '创建时间': item.创建时间
  };
  dialogVisible.value = true;
  dialogTitle.value = `编辑 ${resourceName.value}`;
};

const addItem = () => {
  formData.value = {
    ID: '',
    '维保编号': '',
    '使用单位': '',
    '维保开始时间': '',
    '维保结束时间': '',
    '维保金额': '',
    '签订时间': '',
    '维保类型': '清包',
    '结算方式': '按年',
    '备注': '',
    '创建时间': ''
  };
  dialogVisible.value = true;
  dialogTitle.value = `新增 ${resourceName.value}`;
};

const generateContractNumber = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/api/${resource.value}/generate-contract-number`);
    formData.value.维保编号 = response.data.contractNumber;
  } catch (error) {
    console.error('生成合同编号时出错:', error);
  }
};

const saveForm = async () => {
  try {
    const isValid = await formRef.value?.validate();
    if (!isValid) return;

    if (formData.value.ID) {
      const { ID, 创建时间, ...rest } = formData.value;
      await axios.put(`${apiBaseUrl}/api/${resource.value}/${formData.value.ID}`, rest);
    } else {
      const { 创建时间, ...rest } = formData.value;
      await axios.post(`${apiBaseUrl}/api/${resource.value}`, rest);
    }
    dialogVisible.value = false;
    fetchData();
  } catch (error) {
    console.error('保存数据时出错:', error);
  }
};

const deleteItem = async (id: string) => {
  if (confirm('确定要删除这条记录吗？')) {
    try {
      await axios.delete(`${apiBaseUrl}/api/${resource.value}/${id}`);
      fetchData();
    } catch (error) {
      console.error('删除数据时出错:', error);
    }
  }
};

const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize;
  fetchData();
};

const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage;
  fetchData();
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
/* 可按需添加更多样式 */
</style>