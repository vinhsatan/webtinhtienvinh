/*
Argo Workflows Connector (Node/TypeScript)
Prereqs: `npm install axios`
This example uses Argo Server HTTP API to submit, get status, and terminate workflows.
Adjust `ARGO_SERVER` and `NAMESPACE` accordingly.
*/

import axios from 'axios';
import { appendAudit } from '../audit/auditService';

const ARGO_SERVER = process.env.ARGO_SERVER ?? 'http://localhost:2746';
const NAMESPACE = process.env.ARGO_NAMESPACE ?? 'default';

export async function submitWorkflow(workflowManifest: any, options?: { executionToken?: string }) {
  // attach token as annotation or env for the workflow
  if (options?.executionToken) {
    workflowManifest.metadata = workflowManifest.metadata || {};
    workflowManifest.metadata.annotations = workflowManifest.metadata.annotations || {};
    workflowManifest.metadata.annotations['automation.execution_token'] = options.executionToken;
    // also propagate to container envs if templates available
    if (workflowManifest.spec?.templates) {
      for (const t of workflowManifest.spec.templates) {
        if (t.container) {
          t.container.env = t.container.env || [];
          t.container.env.push({ name: 'EXECUTION_TOKEN_ANNOTATION', valueFrom: { fieldRef: { fieldPath: `metadata.annotations['automation.execution_token']` } } });
        }
      }
    }
  }

  const url = `${ARGO_SERVER}/api/v1/workflows/${encodeURIComponent(NAMESPACE)}`;
  const resp = await axios.post(url, workflowManifest, { headers: { 'Content-Type': 'application/json' } });
  appendAudit({ action: 'argo.submit', workflow: resp.data, metadata: { manifestName: workflowManifest.metadata?.generateName ?? workflowManifest.metadata?.name } });
  return resp.data;
}

export async function getWorkflow(name: string) {
  const url = `${ARGO_SERVER}/api/v1/workflows/${encodeURIComponent(NAMESPACE)}/${encodeURIComponent(name)}`;
  const resp = await axios.get(url);
  return resp.data;
}

export async function terminateWorkflow(name: string, message = 'terminated-by-orchestrator') {
  const url = `${ARGO_SERVER}/api/v1/workflows/${encodeURIComponent(NAMESPACE)}/${encodeURIComponent(name)}/terminate`;
  const resp = await axios.post(url, { message });
  appendAudit({ action: 'argo.terminate', name, message });
  return resp.data;
}

// Example YAML template helper (returns an object ready to POST):
export function createSimpleWorkflowTemplate(name: string, containerImage: string, command: string[]) {
  return {
    metadata: { generateName: `${name}-` },
    spec: {
      entrypoint: 'main',
      templates: [
        {
          name: 'main',
          container: {
            image: containerImage,
            command,
          },
        },
      ],
    },
  };
}
