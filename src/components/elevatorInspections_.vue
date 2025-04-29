<template>
  <div>
    <el-card>
      <template #header>
        <h1>电梯年检管理</h1>
      </template>
      
      <!-- 操作栏 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-input 
            v-model="searchQuery" 
            placeholder="搜索使用单位或设备代码" 
            @input="search" 
            clearable 
          />
        </el-col>
        <el-col :span="4">
          <el-button @click="exportData">导出数据</el-button>
        </el-col>
        <el-col :span="4">
          <el-upload
            class="upload-demo"
            drag
            :action="`${apiBaseUrl}/api/elevatorInspections/import`"
            :headers="headers"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            accept=".xlsx,.xls"
            name="file"
          >
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
            <div class="el-upload__tip" slot="tip">只能上传Excel文件，且不超过10MB</div>
          </el-upload>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="addInspection">新增年检记录</el-button>
        </el-col>
      </el-row>

      <!-- 表格区域 -->
      <el-table 
        :data="data" 
        stripe 
        @selection-change="handleSelectionChange"
      >
        <!-- 复选框列 -->
        <el-table-column type="selection" width="55" />
        
        <!-- 表格内容列 -->
        <el-table-column prop="ID" label="ID" />
        <el-table-column prop="使用单位" label="使用单位" />
        <el-table-column prop="产品编号" label="产品编号" />
        <el-table-column prop="设备代码" label="设备代码" />
        <el-table-column prop="制造单位" label="制造单位" />
        <el-table-column prop="年检日期" label="年检日期" />
        <el-table-column prop="下次年检日期" label="下次年检日期" />
        <el-table-column prop="年检中发现的问题" label="年检中发现的问题" />
        <el-table-column prop="整改是否完毕" label="整改是否完毕" />
        <el-table-column prop="是否合格" label="是否合格" />
        
        <!-- 操作列 -->
        <el-table-column label="操作">
          <template #default="scope">
            <el-button size="small" @click="editInspection(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteInspection(scope.row.ID)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 批量操作区域 -->
      <el-row style="margin-top: 15px;">
        <el-col :span="24">
          <el-button 
            type="danger" 
            :disabled="selectedItems.length === 0" 
            @click="batchDelete"
          >
            批量删除
          </el-button>
          <el-button 
            type="danger" 
            @click="deleteAllInspections"
          >
            删除所有记录
          </el-button>
        </el-col>
      </el-row>

      <!-- 分页控件 -->
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 30]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalCount"
        style="margin-top: 20px;"
      />
    </el-card>
    
    <!-- 表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle">
      <el-form 
        :model="formData" 
        label-width="120px" 
        :rules="rules" 
        ref="formRef"
      >
        <el-form-item label="电梯ID" prop="电梯基本信息表ID">
          <el-select
            v-model="formData.电梯基本信息表ID"
            placeholder="请选择电梯"
            filterable
            remote
            :remote-method="searchElevators"
            loading-text="加载中..."
          >
            <el-option
              v-for="elevator in elevators"
              :key="elevator.ID"
              :label="`${elevator.使用单位} - ${elevator.产品编号} - ${elevator.设备代码}`"
              :value="elevator.ID"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="年检日期" prop="年检日期">
          <el-date-picker
            v-model="formData.年检日期"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            @change="calculateNextInspectionDate"
          />
        </el-form-item>
        <el-form-item label="下次年检日期" prop="下次年检日期">
          <el-date-picker
            v-model="formData.下次年检日期"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="年检中发现的问题" prop="年检中发现的问题">
          <el-input v-model="formData.年检中发现的问题" type="textarea" />
        </el-form-item>
        <el-form-item label="整改是否完毕" prop="整改是否完毕">
          <el-select v-model="formData.整改是否完毕">
            <el-option label="是" value="是" />
            <el-option label="否" value="否" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否合格" prop="是否合格">
          <el-select v-model="formData.是否合格">
            <el-option label="合格" value="合格" />
            <el-option label="不合格" value="不合格" />
          </el-select>
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
import { ElForm, ElMessage } from 'element-plus';

// 定义接口
interface Inspection {
  ID: string;
  '电梯基本信息表ID': string | null;
  '年检日期': string;
  '下次年检日期': string;
  '年检中发现的问题': string;
  '整改是否完毕': string;
  '是否合格': string;
  使用单位: string;
  产品编号: string;
  设备代码: string;
  设备品种: string;
  制造单位: string;
  [key: string]: any;
}

interface Elevator {
  ID: string;
  使用单位: string;
  产品编号: string;
  设备代码: string;
  制造单位: string;
}

const formRef = ref<InstanceType<typeof ElForm>>();

const apiBaseUrl = 'http://localhost:3000';
const headers = ref({
  Authorization: 'Bearer ' + localStorage.getItem('token'),
});

const resourceName = ref('电梯年检管理');
const data = ref<Inspection[]>([]);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);
const dialogVisible = ref(false);
const formData = ref<Inspection>({
  ID: '',
  '电梯基本信息表ID': null,
  '年检日期': '',
  '下次年检日期': '',
  '年检中发现的问题': '',
  '整改是否完毕': '',
  '是否合格': '',
  使用单位: '',
  产品编号: '',
  设备代码: '',
  设备品种: '',
  制造单位: '',
});
const dialogTitle = ref('');
const elevators = ref<Elevator[]>([]);
const selectedItems = ref<Inspection[]>([]);

const rules = {
  '电梯基本信息表ID': [{ required: true, message: '电梯ID不能为空', trigger: 'blur' }],
  '年检日期': [{ required: true, message: '年检日期不能为空', trigger: 'blur' }],
  '下次年检日期': [{ required: true, message: '下次年检日期不能为空', trigger: 'blur' }]
};

// 获取年检数据
const fetchData = async () => {
  try {
    const response = await axios.get<Record<string, any>>(`${apiBaseUrl}/api/elevatorInspections`, {
      params: {
        page: currentPage.value,
        limit: pageSize.value,
        q: searchQuery.value
      }
    });
    data.value = response.data.data as Inspection[];
    totalCount.value = response.data.totalCount;
  } catch (error) {
    console.error('获取年检数据时出错:', error);
  }
};

// 获取电梯数据
const fetchElevators = async (params?: any) => {
  try {
    const response = await axios.get(`${apiBaseUrl}/api/elevatorBasicInfos`, { params });
    elevators.value = response.data.data as Elevator[];
  } catch (error) {
    console.error('获取电梯数据时出错:', error);
  }
};

// 搜索功能
const search = () => {
  currentPage.value = 1;
  fetchData();
};

// 导出数据
const exportData = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/api/elevatorInspections/export`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '电梯年检管理.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('导出数据时出错:', error);
  }
};

// 编辑年检记录
const editInspection = (item: Inspection) => {
  formData.value = { ...item };
  dialogVisible.value = true;
  dialogTitle.value = '编辑年检记录';
};

// 新增年检记录
const addInspection = () => {
  formData.value = {
    ID: '',
    '电梯基本信息表ID': null,
    '年检日期': '',
    '下次年检日期': '',
    '年检中发现的问题': '',
    '整改是否完毕': '',
    '是否合格': '',
  };
  dialogVisible.value = true;
  dialogTitle.value = '新增年检记录';
};

// 保存表单
const saveForm = async () => {
  try {
    const isValid = await formRef.value?.validate();
    if (!isValid) return;

    if (formData.value.ID) {
      const { ID, ...rest } = formData.value;
      await axios.put(`${apiBaseUrl}/api/elevatorInspections/${formData.value.ID}`, rest);
    } else {
      await axios.post(`${apiBaseUrl}/api/elevatorInspections`, formData.value);
    }
    dialogVisible.value = false;
    fetchData();
  } catch (error) {
    console.error('保存数据时出错:', error);
  }
};

// 删除单条年检记录
const deleteInspection = async (id: string) => {
  if (confirm('确定要删除这条记录吗？')) {
    try {
      await axios.delete(`${apiBaseUrl}/api/elevatorInspections/${id}`);
      fetchData();
    } catch (error) {
      console.error('删除数据时出错:', error);
    }
  }
};

// 分页相关函数
const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize;
  fetchData();
};

const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage;
  fetchData();
};

// 搜索结果获取电梯
const searchElevators = async (query: string) => {
  if (query) {
    fetchElevators({
      q: query,
      page: 1,
      limit: 10
    });
  } else {
    fetchElevators();
  }
};

// 计算下次年检日期
const calculateNextInspectionDate = (date: string) => {
  if (date) {
    const dateParts = date.split('-');
    if (dateParts.length === 3) {
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);
      const currentDate = new Date(year, month, day);
      
      if (!isNaN(currentDate.getTime())) {
        const nextYear = currentDate.getFullYear() + 1;
        const nextDate = new Date(nextYear, month, day);
        formData.value.下次年检日期 = nextDate.toISOString().split('T')[0];
      } else {
        console.error('无效日期:', date);
      }
    } else {
      console.error('日期格式不正确:', date);
    }
  }
};

// 批量删除
const handleSelectionChange = (val: Inspection[]) => {
  selectedItems.value = val;
};

const batchDelete = () => {
  if (selectedItems.value.length === 0) return;
  
  if (confirm(`确定要删除选中的 ${selectedItems.value.length} 条记录吗？`)) {
    const deletePromises = selectedItems.value.map(item => 
      axios.delete(`${apiBaseUrl}/api/elevatorInspections/${item.ID}`)
    );
    
    Promise.all(deletePromises)
      .then(() => {
        ElMessage.success('删除成功');
        fetchData();
      })
      .catch(error => {
        console.error('批量删除时出错:', error);
        ElMessage.error('删除失败');
      });
  }
};

// 删除所有记录
const deleteAllInspections = () => {
  if (confirm('确定要删除所有记录吗？此操作无法撤销。')) {
    try {
      axios.delete(`${apiBaseUrl}/api/elevatorInspections/delete-all`)
        .then(() => {
          data.value = [];
          totalCount.value = 0;
          ElMessage.success('所有记录已删除');
        })
        .catch(error => {
          console.error('删除所有记录时出错:', error);
          ElMessage.error('删除所有记录失败');
        });
    } catch (error) {
      console.error('删除所有记录时出错:', error);
    }
  }
};

// 上传文件相关
const handleUploadSuccess = (response: { success: boolean; message?: string }, file: File) => {
  if (response.success) {
    ElMessage.success('文件上传成功');
    fetchData();
  } else {
    ElMessage.error('文件上传失败: ' + (response.message || '未知错误'));
  }
};

const handleUploadError = (err: Error, file: File) => {
  console.error('文件上传错误:', err);
  ElMessage.error('文件上传失败');
};

onMounted(() => {
  fetchData();
  fetchElevators();
});
</script>

<style scoped>
.upload-demo {
  width: 100%;
}
</style>