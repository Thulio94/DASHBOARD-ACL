import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "NOME_CLIENTE",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nome do Cliente
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "DOCUMENTO_CLIENTE",
    header: "CNPJ",
    cell: ({ row }) => {
      const value = row.getValue("DOCUMENTO_CLIENTE");
      return <span className="font-mono">{value}</span>;
    },
  },
  {
    accessorKey: "TIPO_MOVIMENTO",
    header: "Tipo de Movimento",
    cell: ({ row }) => {
      const value = row.getValue("TIPO_MOVIMENTO");
      return (
        <Badge variant="secondary" className="font-semibold">
          {value}
        </Badge>
      );
    },
  },
  {
    accessorKey: "DIAS EM ATRASO",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Dias em Atraso
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = row.getValue("DIAS EM ATRASO");
      const isOverdue = value !== "A VENCER";
      return (
        <Badge variant={isOverdue ? "destructive" : "secondary"}>
          {value}
        </Badge>
      );
    },
  },
];