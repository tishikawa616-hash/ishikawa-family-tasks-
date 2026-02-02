const fs = require('fs');
const path = require('path');

const dirs = ['src/features/accounting', 'src/app/accounting'];

function traverse(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      traverse(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;

      // Replacements
      content = content.replace(/@\/components\//g, '@/features/accounting/components/');
      
      // Fix specific common UI lib back to root if needed (optional, assuming we copied everything or want to use root)
      // If we want to use root UI for "ui" folder:
      // content = content.replace(/@\/features\/accounting\/components\/ui\//g, '@/components/ui/');
      
      content = content.replace(/from "transactions"/g, 'from "acc_transactions"');
      content = content.replace(/from "accounts"/g, 'from "acc_accounts"');
      content = content.replace(/from "account_types"/g, 'from "acc_account_types"');
      content = content.replace(/from "family_groups"/g, 'from "acc_family_groups"');
      content = content.replace(/from "family_group_members"/g, 'from "acc_family_group_members"');
      content = content.replace(/from "fixed_assets"/g, 'from "acc_fixed_assets"');
      content = content.replace(/from "monthly_notes"/g, 'from "acc_monthly_notes"');
      content = content.replace(/from "transaction_comments"/g, 'from "acc_transaction_comments"');
      
      // Libs
      // Special case for supabase
      content = content.replace(/@\/lib\/supabase/g, 'TEMP_SUPABASE_LIB');
      content = content.replace(/@\/lib\//g, '@/features/accounting/lib/');
      content = content.replace(/TEMP_SUPABASE_LIB/g, '@/lib/supabase');
      
      // Types
      content = content.replace(/@\/types\//g, '@/features/accounting/types/');
      
      // Utils
      content = content.replace(/@\/utils\//g, '@/features/accounting/utils/');

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  });
}

dirs.forEach(d => traverse(d));
