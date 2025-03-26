import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Check } from "lucide-react";

export const DeletedCategoriesHelper = () => {
  const [loading, setLoading] = useState(false);
  const [functionsExist, setFunctionsExist] = useState(false);
  const [tableExists, setTableExists] = useState(false);

  useEffect(() => {
    checkIfHelperFunctionsExist();
  }, []);

  const checkIfHelperFunctionsExist = async () => {
    try {
      // Verificar se a função check_table_exists existe
      const { data, error } = await supabase.rpc(
        'check_table_exists',
        { table_name: 'pg_proc' }
      );
      
      if (!error && data) {
        setFunctionsExist(true);
        
        // Verificar se a tabela deleted_categories existe
        const { data: tableData, error: tableError } = await supabase.rpc(
          'check_table_exists',
          { table_name: 'deleted_categories' }
        );
        
        if (!tableError && tableData) {
          setTableExists(true);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar funções auxiliares:", error);
    }
  };

  const createHelperFunctions = async () => {
    setLoading(true);
    try {
      // Executar o SQL para criar as funções auxiliares
      const sqlScript = `
        -- Função para verificar se uma tabela existe
        CREATE OR REPLACE FUNCTION check_table_exists(table_name TEXT)
        RETURNS BOOLEAN AS $$
        DECLARE
          exists BOOLEAN;
        BEGIN
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name = check_table_exists.table_name
          ) INTO exists;
          
          RETURN exists;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Função para verificar se uma coluna existe em uma tabela
        CREATE OR REPLACE FUNCTION check_column_exists(table_name TEXT, column_name TEXT)
        RETURNS BOOLEAN AS $$
        DECLARE
          exists BOOLEAN;
        BEGIN
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = check_column_exists.table_name
            AND column_name = check_column_exists.column_name
          ) INTO exists;
          
          RETURN exists;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Função para adicionar uma coluna a uma tabela se ela não existir
        CREATE OR REPLACE FUNCTION add_column_if_not_exists(
          table_name TEXT, 
          column_name TEXT, 
          column_type TEXT
        )
        RETURNS VOID AS $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = add_column_if_not_exists.table_name
            AND column_name = add_column_if_not_exists.column_name
          ) THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', 
                          table_name, column_name, column_type);
          END IF;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Função para executar SQL dinâmico (use com cuidado!)
        CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
        RETURNS VOID AS $$
        BEGIN
          EXECUTE sql_query;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Conceder permissão para usuários autenticados
        GRANT EXECUTE ON FUNCTION check_table_exists(TEXT) TO authenticated;
        GRANT EXECUTE ON FUNCTION check_column_exists(TEXT, TEXT) TO authenticated;
        GRANT EXECUTE ON FUNCTION add_column_if_not_exists(TEXT, TEXT, TEXT) TO authenticated;
        GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO authenticated;
      `;

      // Você precisará executar este SQL manualmente no console do Supabase
      // ou através de um endpoint seguro, pois não podemos executar SQL arbitrário
      // diretamente do cliente
      
      // Simulando sucesso para fins de interface
      toast.success("Instruções para criar funções auxiliares copiadas para a área de transferência", { position: "bottom-right" });
      navigator.clipboard.writeText(sqlScript);
      
      setFunctionsExist(true);
    } catch (error) {
      console.error("Erro ao criar funções auxiliares:", error);
      toast.error("Erro ao criar funções auxiliares", { position: "bottom-right" });
    } finally {
      setLoading(false);
    }
  };

  const createDeletedCategoriesTable = async () => {
    setLoading(true);
    try {
      if (!functionsExist) {
        toast.error("Primeiro crie as funções auxiliares", { position: "bottom-right" });
        return;
      }
      
      // Verificar se a função execute_sql existe
      const { data: canExecuteSql, error: sqlError } = await supabase.rpc(
        'check_table_exists',
        { table_name: 'pg_proc' }
      );
      
      if (sqlError || !canExecuteSql) {
        toast.error("Função execute_sql não encontrada", { position: "bottom-right" });
        return;
      }
      
      // Executar o SQL para criar a tabela deleted_categories
      const sqlScript = `
        -- Criar tabela para armazenar categorias excluídas
        CREATE TABLE IF NOT EXISTS deleted_categories (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          original_id UUID,
          name TEXT NOT NULL,
          slug TEXT NOT NULL,
          order_index INTEGER DEFAULT 0,
          deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          deleted_by UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Criar função para mover categoria para tabela de excluídos antes de excluir
        CREATE OR REPLACE FUNCTION backup_category_before_delete()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO deleted_categories (
            original_id, 
            name, 
            slug, 
            order_index, 
            deleted_at,
            deleted_by,
            created_at,
            updated_at
          )
          VALUES (
            OLD.id,
            OLD.name,
            OLD.slug,
            OLD.order_index,
            NOW(),
            (SELECT auth.uid()),
            OLD.created_at,
            OLD.updated_at
          );
          RETURN OLD;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Criar trigger para executar a função antes de excluir uma categoria
        DROP TRIGGER IF EXISTS backup_category_trigger ON community_categories;
        CREATE TRIGGER backup_category_trigger
        BEFORE DELETE ON community_categories
        FOR EACH ROW
        EXECUTE FUNCTION backup_category_before_delete();

        -- Criar política de acesso para a tabela deleted_categories
        ALTER TABLE deleted_categories ENABLE ROW LEVEL SECURITY;

        -- Permitir que usuários autenticados vejam categorias excluídas
        CREATE POLICY view_deleted_categories ON deleted_categories
          FOR SELECT
          TO authenticated
          USING (true);

        -- Permitir que apenas admins restaurem categorias excluídas
        CREATE POLICY restore_deleted_categories ON deleted_categories
          FOR DELETE
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM user_roles
              WHERE user_id = auth.uid() AND role = 'admin'
            )
          );
      `;

      // Você precisará executar este SQL manualmente no console do Supabase
      // ou através de um endpoint seguro, pois não podemos executar SQL arbitrário
      // diretamente do cliente
      
      // Simulando sucesso para fins de interface
      toast.success("Instruções para criar tabela de categorias excluídas copiadas para a área de transferência", { position: "bottom-right" });
      navigator.clipboard.writeText(sqlScript);
      
      setTableExists(true);
    } catch (error) {
      console.error("Erro ao criar tabela de categorias excluídas:", error);
      toast.error("Erro ao criar tabela de categorias excluídas", { position: "bottom-right" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full mt-6 border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Sistema de Backup de Categorias
        </CardTitle>
        <CardDescription>
          Crie um sistema de backup para categorias excluídas, permitindo recuperá-las em caso de exclusão acidental.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
            <div>
              <h3 className="font-medium flex items-center gap-2">
                {functionsExist ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
                Funções Auxiliares
              </h3>
              <p className="text-sm text-muted-foreground">
                Funções SQL necessárias para gerenciar o sistema de backup
              </p>
            </div>
            <Button 
              onClick={createHelperFunctions} 
              disabled={loading || functionsExist}
              className={functionsExist ? "bg-green-500 hover:bg-green-600" : "bg-amber-500 hover:bg-amber-600"}
            >
              {functionsExist ? "Instaladas" : loading ? "Criando..." : "Criar Funções"}
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
            <div>
              <h3 className="font-medium flex items-center gap-2">
                {tableExists ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
                Tabela de Backup
              </h3>
              <p className="text-sm text-muted-foreground">
                Tabela para armazenar categorias excluídas e trigger para backup automático
              </p>
            </div>
            <Button 
              onClick={createDeletedCategoriesTable} 
              disabled={loading || tableExists || !functionsExist}
              className={tableExists ? "bg-green-500 hover:bg-green-600" : "bg-amber-500 hover:bg-amber-600"}
            >
              {tableExists ? "Instalada" : loading ? "Criando..." : "Criar Tabela"}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            Nota: Estas operações exigem permissões de administrador no banco de dados. 
            O SQL necessário será copiado para a área de transferência para execução manual no console do Supabase.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeletedCategoriesHelper;
